#!/usr/bin/env node

/**
 * Tend a raised kit: run it with `composer dev` and copy every change you make in
 * raised/<kit> back to the smial that owns the file. New files go to the kit's top smial.
 *
 * Usage: node scripts/tend.js --react [--once] [--no-serve] [--path=<dir>]
 *
 *   --once      Sync once and exit, without watching or serving.
 *   --no-serve  Watch and sync, but do not start `composer dev`.
 *   --path      Tend a kit raised somewhere other than raised/<kit>.
 */

import chokidar from 'chokidar';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { loadManifest, log, normalizePath, owningSmial, raisedDir, restoreReplacements, rootDir, run, smialsDir } from './helpers.js';

const args = process.argv.slice(2);
const option = name => args.find(arg => arg.startsWith(`--${name}=`))?.split('=')[1];
const manifest = loadManifest();
const kitName = args.map(arg => arg.slice(2)).find(arg => manifest.kits[arg]);

if (!kitName) {
    log(`Name the kit to tend, for example --react. Kits: ${Object.keys(manifest.kits).join(', ')}`, 'red');
    process.exit(1);
}

const kit = manifest.kits[kitName];
const kitDir = option('path') ? path.resolve(option('path')) : path.join(raisedDir, kitName);
const excluded = new Set(kit.exclude ?? []);

if (!fs.existsSync(path.join(kitDir, 'composer.json'))) {
    log(`${kit.label} has not been raised. Run 'php artisan raise --kit=${kitName}' first.`, 'red');
    process.exit(1);
}

/**
 * Ask git which files the kit's own .gitignore files ignore. Every raised kit is its own repository.
 */
function isIgnored(relativePath) {
    if (/^(\.git|vendor|node_modules)(\/|$)/.test(relativePath) || relativePath === '.env') {
        return true;
    }

    try {
        execFileSync('git', ['-C', kitDir, 'check-ignore', '-q', relativePath], { stdio: 'ignore' });

        return true;
    } catch {
        return false;
    }
}

function syncFile(absolutePath) {
    const relativePath = normalizePath(path.relative(kitDir, absolutePath));

    if (excluded.has(relativePath) || isIgnored(relativePath)) {
        return false;
    }

    const smial = owningSmial(relativePath, kit.smials);
    const destination = path.join(smialsDir, smial, relativePath);
    let source = fs.readFileSync(absolutePath);

    if (manifest.replacementPaths.includes(relativePath)) {
        source = Buffer.from(restoreReplacements(source.toString('utf-8'), destination, kit.replacements));
    }

    if (fs.existsSync(destination) && fs.readFileSync(destination).equals(source)) {
        return false;
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, source);
    log(`Tended ${relativePath} -> smials/${smial}`, 'green');

    return true;
}

function deleteFile(absolutePath) {
    const relativePath = normalizePath(path.relative(kitDir, absolutePath));

    if (isIgnored(relativePath)) {
        return;
    }

    const smial = owningSmial(relativePath, kit.smials);
    const destination = path.join(smialsDir, smial, relativePath);

    if (fs.existsSync(destination)) {
        fs.unlinkSync(destination);
        log(`Removed smials/${smial}/${relativePath}`, 'yellow');
    }
}

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'vendor', '.git'].includes(entry.name)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        entry.isDirectory() ? walk(fullPath, files) : files.push(fullPath);
    }

    return files;
}

log(`Tending ${kit.label}: syncing raised/${kitName} back to smials/...`, 'blue');
const synced = walk(kitDir).filter(syncFile).length;
log(`${synced} file(s) tended`, 'green');

if (args.includes('--once')) {
    process.exit(0);
}

chokidar
    .watch(kitDir, {
        ignoreInitial: true,
        ignored: file => /\/(node_modules|vendor|\.git)(\/|$)/.test(file),
        awaitWriteFinish: { stabilityThreshold: 100 },
    })
    .on('add', syncFile)
    .on('change', syncFile)
    .on('unlink', deleteFile);

log(`Watching raised/${kitName}. Stop this before raising ${kit.label} again.`, 'blue');

if (!args.includes('--no-serve')) {
    if (!fs.existsSync(path.join(kitDir, 'vendor'))) {
        log('Running composer setup...', 'blue');
        await run('composer', ['setup'], { cwd: kitDir });
    }

    await run('composer', ['dev'], { cwd: kitDir }).catch(error => log(error.message, 'red'));
    process.exit(0);
}
