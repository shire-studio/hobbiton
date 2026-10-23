#!/usr/bin/env node

/**
 * Harvest: the weekly dependency update for every kit, and for Hobbiton itself on a full run.
 *
 * Phase 1 updates each kit in raised/<kit> and tends it back. Every Vet question comes here, and each
 * release is asked about once per run: approvals are seeded into later kits, and a declined release
 * is held at its current version for the rest of the run. Phase 2 surveys every updated kit, with no
 * questions. Majors and deliberate holds are never applied, only reported.
 *
 * Usage: node scripts/harvest.js [--vue] [--react] [--svelte] [--livewire] [--api] [--blade]
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { loadManifest, log, parseArgs, prepareKit, raisedDir, rootDir, run } from './helpers.js';
import {
    bumpablePackages,
    catalogEntries,
    composerFindings,
    formatFindings,
    formatHolds,
    groupFindings,
    lockMismatches,
    npmMajors,
    npmZeroMinors,
    staleExcludes,
} from './outdated.js';
import { holdArguments, lockVersions, newGrants, poolKey, pruneTrust, readJson, rejectedPackages, seedTrust, writeTrust } from './trust.js';

const ATTEMPTS = 3;
const TAZE = path.join(rootDir, 'node_modules', '.bin', 'taze');
const TAZE_FLAGS = ['--no-github-actions', '--no-node-version', '--maturity-period', '2'];
const INERTIA = ['vue', 'react', 'svelte'];

const manifest = loadManifest();
const args = process.argv.slice(2);
const { kits } = parseArgs(args, [], manifest);
const fullRun = !args.some(arg => manifest.kits[arg.slice(2)]);

const pool = new Map();
const rejected = new Set();
const majors = [];
const holds = [];
const stale = [];
const failures = [];
const updated = [];

const capture = async (command, commandArgs, cwd) =>
    (await promisify(execFile)(command, commandArgs, { cwd, maxBuffer: 64 * 1024 * 1024 })).stdout;

/**
 * Vet asks its questions through the terminal. Without one it fails every new release, which would look like a rejection.
 */
if (!process.stdin.isTTY || !process.stdout.isTTY) {
    log('Harvest asks Vet questions, so run it in an interactive terminal.', 'red');
    process.exit(1);
}

async function guard() {
    const untended = [];

    for (const name of kits) {
        if (!fs.existsSync(path.join(raisedDir, name, 'composer.json'))) {
            continue;
        }

        await run('node', [path.join(rootDir, 'scripts', 'tend.js'), `--${name}`, '--once', '--check'], { cwd: rootDir }).catch(() => untended.push(name));
    }

    if (untended.length > 0) {
        log(`Untended changes in raised/ for: ${untended.join(', ')}. Tend them (composer tend -- --<kit> --once) or raise the kit again, then harvest.`, 'red');
        process.exit(1);
    }

    if ((await capture('git', ['status', '--porcelain'], rootDir)).trim() !== '') {
        log('Hobbiton has uncommitted changes. They will mix into what harvest changes.', 'yellow');
    }
}

/**
 * composer update, asking Vet about each release once per run and holding back what the user declines.
 */
async function updateComposer(dir) {
    const lockFile = path.join(dir, 'composer.lock');
    const trustFile = path.join(dir, 'vet.json');
    const oldLock = readJson(lockFile);
    const trustBefore = readJson(trustFile);

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        const { args: holding, unheld } = holdArguments(rejected, oldLock);

        // Vet only asks questions when the trust file has entries, but reads its release age holdback from the same file.
        // Solving against an empty copy writes the lock with the holdback and without questions, which come at `composer install`
        // once this run's earlier approvals are seeded for the new lock.
        const trust = readJson(trustFile);

        writeTrust(trustFile, { ...trust, require: {}, 'require-dev': {} });

        try {
            await run('composer', ['update', '--no-install', '--no-scripts', '--no-progress', ...holding], { cwd: dir });
        } finally {
            writeTrust(trustFile, trust);
        }

        const newLock = readJson(lockFile);
        const added = unheld.filter(name => lockVersions(newLock).has(name));

        if (added.length > 0) {
            throw new Error(`cannot hold back ${added.join(', ')}, which this update adds`);
        }

        writeTrust(trustFile, seedTrust(readJson(trustFile), newLock, pool));

        try {
            await run('composer', ['install', '--no-progress'], { cwd: dir });
        } catch (error) {
            const declined = rejectedPackages(oldLock, newLock, readJson(trustFile));

            if (declined.length === 0) {
                throw error;
            }

            declined.forEach(name => rejected.add(name));
            log(`Holding back ${declined.join(', ')}`, 'yellow');
            continue;
        }

        const trustAfter = readJson(trustFile);

        for (const grant of newGrants(trustBefore, trustAfter)) {
            pool.set(poolKey(grant.name, grant.version), grant);
        }

        writeTrust(trustFile, pruneTrust(trustAfter, newLock));

        const bumpable = bumpablePackages(readJson(path.join(dir, 'composer.json')));

        if (bumpable.length > 0) {
            await run('composer', ['bump', '--no-scripts', ...bumpable], { cwd: dir });
        }

        return;
    }

    throw new Error(`gave up after ${ATTEMPTS} attempts`);
}

async function updateNpm(dir) {
    const zeroMinors = npmZeroMinors(JSON.parse(await capture(TAZE, ['major', '--json', ...TAZE_FLAGS], dir)));

    await run(TAZE, ['minor', '-w', ...TAZE_FLAGS, ...(zeroMinors.length > 0 ? ['-x', zeroMinors.join(',')] : [])], { cwd: dir });
    await run('pnpm', ['update'], { cwd: dir });
}

async function collectFindings(dir, label) {
    const composerJson = readJson(path.join(dir, 'composer.json'));
    const composer = composerFindings(composerJson, JSON.parse(await capture('composer', ['outdated', '--direct', '--format=json'], dir)), label);

    majors.push(...composer.majors);
    holds.push(...composer.holds);

    if (!fs.existsSync(path.join(dir, 'package.json'))) {
        return;
    }

    majors.push(...npmMajors(JSON.parse(await capture(TAZE, ['major', '--json', ...TAZE_FLAGS], dir)), label));

    const workspaceFile = path.join(dir, 'pnpm-workspace.yaml');

    if (!fs.existsSync(workspaceFile)) {
        return;
    }

    const workspace = fs.readFileSync(workspaceFile, 'utf-8');

    for (const { name, version } of catalogEntries(workspace)) {
        const latest = (await capture('pnpm', ['view', name, 'version'], dir)).trim();

        latest !== version && holds.push({ name, from: version, to: latest, kit: label });
    }

    stale.push(...staleExcludes(workspace, fs.readFileSync(path.join(dir, 'pnpm-lock.yaml'), 'utf-8')).map(entry => `${entry} (${label})`));
}

async function harvestHobbiton() {
    log('Harvesting Hobbiton...', 'blue');

    try {
        await updateComposer(rootDir);
        await updateNpm(rootDir);
        await collectFindings(rootDir, 'hobbiton');
    } catch (error) {
        failures.push('Hobbiton');
        log(`Hobbiton failed: ${error.message}`, 'red');
    }
}

async function harvestKit(name) {
    const kit = manifest.kits[name];

    log(`Harvesting ${kit.label}...`, 'blue');

    try {
        const dir = await prepareKit(name);

        await updateComposer(dir);

        if (kit.node) {
            await updateNpm(dir);
        }

        await run('node', [path.join(rootDir, 'scripts', 'tend.js'), `--${name}`, '--once'], { cwd: rootDir });
        await collectFindings(dir, name);
        updated.push(name);
    } catch (error) {
        failures.push(kit.label);
        log(`${kit.label} failed: ${error.message}. Raising it again so raised/${name} matches smials/.`, 'red');
        await run('php', ['artisan', 'raise', `--kit=${name}`], { cwd: rootDir }).catch(raiseError => log(raiseError.message, 'red'));
    }
}

function report() {
    const section = (heading, lines) => {
        if (lines.length > 0) {
            log(heading, 'blue');
            console.log(`${lines.join('\n')}\n`);
        }
    };

    section('Majors to do by hand', majors.length > 0 ? [formatFindings(groupFindings(majors))] : []);
    section('Held back on purpose', holds.length > 0 ? [formatHolds(groupFindings(holds))] : []);
    section('Declined in Vet and held back this run', [...rejected].sort());

    if (INERTIA.every(name => updated.includes(name))) {
        const locks = Object.fromEntries(INERTIA.map(name => [name, readJson(path.join(rootDir, 'smials', `inertia-${name}`, 'composer.lock'))]));

        section(
            'Inertia kits resolved different PHP versions',
            lockMismatches(locks).map(({ name, versions }) => `${name}   ${Object.entries(versions).map(([kit, version]) => `${kit} ${version}`).join(', ')}`),
        );
    }

    section('Stale minimumReleaseAgeExclude entries', stale);

    if (failures.length > 0) {
        log(`Failed: ${failures.join(', ')}`, 'red');
        process.exit(1);
    }

    log('Harvest complete. Review the changes, then commit.', 'green');
}

await guard();

if (fullRun) {
    await harvestHobbiton();
}

for (const name of kits) {
    await harvestKit(name);
}

for (const name of updated) {
    await run('node', [path.join(rootDir, 'scripts', 'survey.js'), `--${name}`, '--tend'], { cwd: rootDir }).catch(() => failures.push(manifest.kits[name].label));
}

if (fullRun) {
    await run('composer', ['test'], { cwd: rootDir }).catch(() => failures.push('Hobbiton tests'));
}

report();
