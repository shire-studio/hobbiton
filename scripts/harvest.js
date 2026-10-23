#!/usr/bin/env node

/**
 * Harvest: the weekly dependency update for every kit, and for Hobbiton itself on a full run.
 *
 * Phase 1 updates each kit in raised/<kit> and tends it back. Every Vet question comes here, and each
 * release is asked about once per run: approvals are seeded into later kits, and a declined release
 * is held at its current version for the rest of the run. Phase 2 surveys every updated kit, with no
 * questions. Majors and deliberate holds are never applied, only reported.
 *
 * The Inertia kits share composer.json and vet.json, so selecting one harvests all three, and the
 * second and third resolve exactly the versions the first one locked.
 *
 * Usage: node scripts/harvest.js [--vue] [--react] [--svelte] [--livewire] [--api] [--blade]
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { promisify } from 'util';
import { loadManifest, log, parseArgs, prepareKit, raisedDir, rootDir, run, smialsDir } from './helpers.js';
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
    withSiblings,
} from './outdated.js';
import {
    hasGrants,
    holdArguments,
    lockVersions,
    newGrants,
    pinArguments,
    poolKey,
    pruneTrust,
    readJson,
    rejectedPackages,
    seedTrust,
    writeTrust,
} from './trust.js';

const ATTEMPTS = 3;
const TAZE = path.join(rootDir, 'node_modules', '.bin', 'taze');
const TAZE_FLAGS = ['--no-github-actions', '--no-node-version', '--maturity-period', '2'];
const INERTIA = ['vue', 'react', 'svelte'];
const TRUST_BACKUP = 'vet.json.harvest';
const ROOT_FILES = ['composer.json', 'composer.lock', 'vet.json', 'package.json', 'pnpm-lock.yaml'];

const manifest = loadManifest();
const args = process.argv.slice(2);
const parsed = parseArgs(args, [], manifest).kits;
const kits = withSiblings(parsed, Object.keys(manifest.kits), INERTIA);
const fullRun = !args.some(arg => manifest.kits[arg.slice(2)]);

const pool = new Map();
const rejected = new Set();
const majors = [];
const holds = [];
const stale = [];
const failures = [];
const findingErrors = [];
const updated = [];
let inertiaLock = null;
let emptiedTrust = null;

/**
 * The user chose to stop at a Vet question, so the run ends without surveying.
 */
class Stop extends Error {}

const capture = async (command, commandArgs, cwd) =>
    (await promisify(execFile)(command, commandArgs, { cwd, maxBuffer: 64 * 1024 * 1024 })).stdout;

/**
 * Vet asks its questions through the terminal. Without one it fails every new release, which would look like a rejection.
 */
if (!process.stdin.isTTY || !process.stdout.isTTY) {
    log('Harvest asks Vet questions, so run it in an interactive terminal.', 'red');
    process.exit(1);
}

/**
 * Put back a trust file emptied for a solve. Synchronous, so it also runs from a signal handler.
 */
function restoreTrust() {
    if (emptiedTrust !== null) {
        fs.renameSync(path.join(emptiedTrust, TRUST_BACKUP), path.join(emptiedTrust, 'vet.json'));
        emptiedTrust = null;
    }
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
        restoreTrust();
        log('Harvest stopped.', 'red');
        process.exit(130);
    });
}

/**
 * A crash during a solve leaves the real trust file beside the emptied one. Put it back before anything reads vet.json.
 */
function recoverTrust() {
    for (const dir of [rootDir, ...Object.keys(manifest.kits).map(name => path.join(raisedDir, name))]) {
        if (fs.existsSync(path.join(dir, TRUST_BACKUP))) {
            fs.renameSync(path.join(dir, TRUST_BACKUP), path.join(dir, 'vet.json'));
            log(`Restored the vet.json an interrupted harvest left in ${path.relative(rootDir, dir) || 'Hobbiton'}`, 'yellow');
        }
    }

    const files = [path.join(rootDir, 'vet.json'), ...fs.readdirSync(smialsDir).map(smial => path.join(smialsDir, smial, 'vet.json'))];
    const empty = files.filter(file => fs.existsSync(file) && !hasGrants(readJson(file)));

    if (empty.length > 0) {
        log(`These trust files hold no grants, so Vet would let every release through: ${empty.map(file => path.relative(rootDir, file)).join(', ')}. Restore them from git first.`, 'red');
        process.exit(1);
    }
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
        log(
            `Untended changes in raised/ for: ${untended.join(', ')}. Tend your own edits (composer tend -- --<kit> --once). If they are left over from an interrupted harvest, raise the kit again (php artisan raise --kit=<kit>) instead.`,
            'red',
        );
        process.exit(1);
    }

    if ((await capture('git', ['status', '--porcelain'], rootDir)).trim() !== '') {
        log('Hobbiton has uncommitted changes. They will mix into what harvest changes.', 'yellow');
    }
}

async function confirmHold(declined) {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    const controller = new AbortController();

    // Ctrl+C here means no, so the run stops rather than hanging on a paused prompt.
    prompt.on('SIGINT', () => controller.abort());

    try {
        const answer = await prompt.question(`Vet did not approve ${declined.join(', ')}. Hold them back for the rest of this run? [y/N] `, { signal: controller.signal });

        return answer.trim().toLowerCase().startsWith('y');
    } catch {
        return false;
    } finally {
        prompt.close();
    }
}

/**
 * composer update, asking Vet about each release once per run and holding back what the user declines.
 * With pins, the update resolves exactly the pinned versions instead.
 */
async function updateComposer(dir, pins = []) {
    const lockFile = path.join(dir, 'composer.lock');
    const trustFile = path.join(dir, 'vet.json');
    const oldLock = readJson(lockFile);
    const trustBefore = readJson(trustFile);

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        const { args: holding, unheld } = holdArguments(rejected, oldLock);

        // Vet only asks questions when the trust file has entries, but reads its release age holdback from the same file.
        // Solving against an empty copy writes the lock with the holdback and without questions, which come at `composer install`
        // once this run's earlier approvals are seeded for the new lock. The real file waits beside it until the solve ends.
        fs.copyFileSync(trustFile, path.join(dir, TRUST_BACKUP));
        emptiedTrust = dir;
        writeTrust(trustFile, { ...readJson(trustFile), require: {}, 'require-dev': {} });

        try {
            await run('composer', ['update', '--no-install', '--no-scripts', '--no-progress', ...(pins.length > 0 ? pins : holding)], { cwd: dir });
        } finally {
            restoreTrust();
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

            // Escape, Ctrl+C at a Vet question or a failed download look the same as unticked packages, so ask.
            if (!(await confirmHold(declined))) {
                throw new Stop('stopped at a Vet question');
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

/**
 * The report is only information, so a failure here never marks an updated kit as failed.
 */
async function reportOn(dir, label) {
    try {
        await collectFindings(dir, label);
    } catch (error) {
        findingErrors.push(`${label}: ${error.message}`);
    }
}

async function harvestHobbiton() {
    const snapshot = Object.fromEntries(ROOT_FILES.filter(file => fs.existsSync(path.join(rootDir, file))).map(file => [file, fs.readFileSync(path.join(rootDir, file))]));

    log('Harvesting Hobbiton...', 'blue');

    try {
        await updateComposer(rootDir);
        await updateNpm(rootDir);
    } catch (error) {
        failures.push('Hobbiton');
        log(`Hobbiton failed: ${error.message}. Putting its dependency files back.`, 'red');

        for (const [file, content] of Object.entries(snapshot)) {
            fs.writeFileSync(path.join(rootDir, file), content);
        }

        await run('composer', ['install', '--no-interaction', '--no-progress'], { cwd: rootDir }).catch(installError => log(installError.message, 'red'));
        await run('pnpm', ['install'], { cwd: rootDir }).catch(installError => log(installError.message, 'red'));

        if (error instanceof Stop) {
            throw error;
        }

        return;
    }

    await reportOn(rootDir, 'hobbiton');
}

/**
 * Raise a kit without installing it. A sibling Inertia kit's old lock no longer fits the composer.json and vet.json
 * the first Inertia kit tended, so it goes straight to an update pinned to that kit's lock.
 */
async function raiseSibling(name) {
    const dir = path.join(raisedDir, name);

    await run('php', ['artisan', 'raise', `--kit=${name}`], { cwd: rootDir });

    if (!fs.existsSync(path.join(dir, '.env'))) {
        fs.copyFileSync(path.join(dir, '.env.example'), path.join(dir, '.env'));
    }

    return dir;
}

async function harvestKit(name) {
    const kit = manifest.kits[name];
    const sibling = INERTIA.includes(name) && inertiaLock !== null;

    log(`Harvesting ${kit.label}${sibling ? ' with the versions the first Inertia kit locked' : ''}...`, 'blue');

    let dir;

    try {
        dir = sibling ? await raiseSibling(name) : await prepareKit(name);

        await updateComposer(dir, sibling ? pinArguments(inertiaLock) : []);

        if (kit.node) {
            await updateNpm(dir);
        }

        await run('node', [path.join(rootDir, 'scripts', 'tend.js'), `--${name}`, '--once'], { cwd: rootDir });
    } catch (error) {
        failures.push(kit.label);
        log(`${kit.label} failed: ${error.message}. Raising it again so raised/${name} matches smials/.`, 'red');
        await run('php', ['artisan', 'raise', `--kit=${name}`], { cwd: rootDir }).catch(raiseError => log(raiseError.message, 'red'));

        if (error instanceof Stop) {
            throw error;
        }

        return;
    }

    if (INERTIA.includes(name) && inertiaLock === null) {
        inertiaLock = readJson(path.join(dir, 'composer.lock'));
    }

    updated.push(name);
    await reportOn(dir, name);
}

function report(stopped) {
    const section = (heading, lines) => {
        if (lines.length > 0) {
            log(heading, 'blue');
            console.log(`${lines.join('\n')}\n`);
        }
    };

    section('Majors to do by hand', majors.length > 0 ? [formatFindings(groupFindings(majors))] : []);
    section('Held back on purpose', holds.length > 0 ? [formatHolds(groupFindings(holds))] : []);
    section('Declined in Vet and held back this run', [...rejected].sort());

    if (kits.some(name => INERTIA.includes(name))) {
        const locks = Object.fromEntries(INERTIA.map(name => [name, readJson(path.join(smialsDir, `inertia-${name}`, 'composer.lock'))]));

        section(
            'Inertia kits resolved different PHP versions, so their shared smials are out of step',
            lockMismatches(locks).map(({ name, versions }) => `${name}   ${Object.entries(versions).map(([kit, version]) => `${kit} ${version}`).join(', ')}`),
        );
    }

    section('Stale minimumReleaseAgeExclude entries', stale);
    section('Could not build the report for', findingErrors);

    if (stopped) {
        log(`Stopped before surveying. ${updated.length > 0 ? `${updated.join(', ')} reached smials/ untested.` : 'No kit reached smials/.'}`, 'red');
        process.exit(1);
    }

    if (failures.length > 0) {
        log(`Failed: ${failures.join(', ')}`, 'red');
        process.exit(1);
    }

    log('Harvest complete. Review the changes, then commit.', 'green');
}

recoverTrust();
await guard();

if (kits.length > parsed.length) {
    log(`The Inertia kits share their PHP dependencies, so harvesting ${INERTIA.join(', ')} together.`, 'yellow');
}

let stopped = false;

try {
    if (fullRun) {
        await harvestHobbiton();
    }

    for (const name of kits) {
        await harvestKit(name);
    }
} catch (error) {
    if (!(error instanceof Stop)) {
        throw error;
    }

    stopped = true;
}

if (!stopped) {
    for (const name of updated) {
        await run('node', [path.join(rootDir, 'scripts', 'survey.js'), `--${name}`, '--tend'], { cwd: rootDir }).catch(() => failures.push(manifest.kits[name].label));
    }

    if (fullRun) {
        await run('composer', ['test'], { cwd: rootDir }).catch(() => failures.push('Hobbiton tests'));
    }
}

report(stopped);
