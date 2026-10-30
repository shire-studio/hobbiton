#!/usr/bin/env node

/**
 * Deliver kits: pack each selected kit (the base kit plus its team overlay) and copy it into a local checkout of its
 * repository. Files the checkout tracks but the kit no longer ships are removed, while
 * untracked files such as .env, vendor and node_modules are left alone. Nothing is
 * committed or pushed.
 *
 * Checkouts default to ../laravel-starter-kit-<kit> next to Hobbiton. Override the parent
 * directory with HOBBITON_DELIVER_DIR.
 *
 * Team kits are delivered with their base kit, so asking for one is an error and no flags delivers
 * the base kits only.
 *
 * Usage: node scripts/deliver.js [--vue] [--react] ...
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { baseKitNames, loadManifest, log, normalizePath, parseArgs, rootDir, run } from './helpers.js';

const manifest = loadManifest();
const given = parseArgs(process.argv.slice(2), [], manifest);
const explicit = process.argv.slice(2).some(arg => manifest.kits[arg.slice(2)]);

for (const name of given.kits.filter(name => manifest.kits[name].base && explicit)) {
    log(`${name} is delivered with ${manifest.kits[name].base}. Deliver --${manifest.kits[name].base} instead.`, 'red');
    process.exit(1);
}

const kits = explicit ? given.kits : baseKitNames(manifest);
const deliverDir = process.env.HOBBITON_DELIVER_DIR ?? path.dirname(rootDir);

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '.git') {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        entry.isDirectory() ? walk(fullPath, files) : files.push(fullPath);
    }

    return files;
}

for (const name of kits) {
    const kit = manifest.kits[name];
    const parcel = fs.mkdtempSync(path.join(os.tmpdir(), `hobbiton-${name}-`));
    const target = path.join(deliverDir, kit.repository.split('/')[1]);

    await run('php', ['artisan', 'pack', `--kit=${name}`, `--to=${parcel}`], { cwd: rootDir });

    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
        await run('git', ['init', '-q', '-b', 'main'], { cwd: target });
    }

    const shipped = new Set(walk(parcel).map(file => normalizePath(path.relative(parcel, file))));

    for (const file of shipped) {
        const destination = path.join(target, file);

        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(path.join(parcel, file), destination);
        fs.chmodSync(destination, fs.statSync(path.join(parcel, file)).mode);
    }

    const tracked = execFileSync('git', ['-C', target, 'ls-files', '-z'], { encoding: 'utf-8' }).split('\0').filter(Boolean);

    for (const file of tracked.filter(file => !shipped.has(file))) {
        fs.rmSync(path.join(target, file), { force: true });
        log(`Removed ${file}, which ${kit.label} no longer ships`, 'yellow');
    }

    fs.rmSync(parcel, { recursive: true, force: true });
    log(`${kit.label} delivered to ${target}`, 'green');
}
