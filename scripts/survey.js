#!/usr/bin/env node

/**
 * Survey kits: raise each selected kit into raised/<kit> and run its full quality suite
 * (composer test: lint, types, type coverage and 100% code coverage).
 *
 * vendor/ and node_modules/ survive between surveys, so only the first survey of a kit is slow.
 *
 * Usage: node scripts/survey.js [--vue] [--react] [--svelte] [--livewire] [--api] [--blade] [--tend]
 *
 *   --tend  Copy lock files and anything the kit's own tooling changed back into smials/.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { log, parseArgs, prepareKit, raisedDir, rootDir, run } from './helpers.js';

const { kits, flags } = parseArgs(process.argv.slice(2), ['tend']);
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'hobbiton.json'), 'utf-8'));
const failures = [];

const git = (dir, ...gitArgs) => run('git', ['-c', 'user.name=Hobbiton', '-c', 'user.email=hobbiton@localhost', ...gitArgs], { cwd: dir });

/**
 * Run the kit's composer test with Pint and Pest TIA caches cleared, so a survey never passes on stale results.
 * Pint caches in the system temp directory, so the run gets a fresh one. TIA keeps its state under ~/.pest/tia,
 * which Pest's own Storage::purge() clears for the kit.
 */
async function surveyCold(dir) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hobbiton-survey-'));

    await run('php', ['-r', "require 'vendor/autoload.php'; if (method_exists(Pest\\Plugins\\Tia\\Storage::class, 'purge')) { Pest\\Plugins\\Tia\\Storage::purge(getcwd()); }"], { cwd: dir });

    try {
        await run('composer', ['test'], { cwd: dir, env: { ...process.env, TMPDIR: tmpDir } });
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

for (const name of kits) {
    const kit = manifest.kits[name];
    const dir = path.join(raisedDir, name);

    log(`Surveying ${kit.label}...`, 'blue');

    try {
        await prepareKit(name);
        await run('php', ['artisan', 'key:generate', '--ansi'], { cwd: dir });

        // Wayfinder reads real column types for route bindings, so the schema must exist before the frontend builds.
        fs.closeSync(fs.openSync(path.join(dir, 'database', 'database.sqlite'), 'a'));
        await run('php', ['artisan', 'migrate', '--force', '--ansi'], { cwd: dir });

        if (kit.node) {
            await run('pnpm', ['install'], { cwd: dir });
            await run('pnpm', ['run', 'build'], { cwd: dir });
        }

        // Pest's TIA mode needs a commit to anchor to.
        await git(dir, 'add', '-A');
        await git(dir, 'commit', '-qm', 'Survey', '--allow-empty');

        await surveyCold(dir);
        log(`${kit.label} passed`, 'green');
    } catch (error) {
        failures.push(kit.label);
        log(`${kit.label} failed: ${error.message}`, 'red');
    }

    if (flags.tend && fs.existsSync(dir)) {
        await run('node', [path.join(rootDir, 'scripts', 'tend.js'), `--${name}`, '--once'], { cwd: rootDir });
    }
}

if (failures.length > 0) {
    log(`Failed: ${failures.join(', ')}`, 'red');
    process.exit(1);
}

log('Every kit passed its survey', 'green');
