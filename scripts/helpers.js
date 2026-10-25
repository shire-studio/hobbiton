import { spawn } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const smialsDir = path.join(rootDir, 'smials');
export const raisedDir = path.join(rootDir, 'raised');
export const overridesFile = path.join(rootDir, 'team-overrides.json');

const colors = { reset: '\x1b[0m', blue: '\x1b[34m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', dim: '\x1b[2m' };

export function log(message, color = 'reset') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

export function loadManifest() {
    return JSON.parse(fs.readFileSync(path.join(rootDir, 'hobbiton.json'), 'utf-8'));
}

/**
 * Split CLI arguments into selected kits (--react, --svelte) and other flags. No kit flags selects every kit.
 */
export function parseArgs(args, flags = [], manifest = loadManifest()) {
    const names = Object.keys(manifest.kits);
    const given = args.filter(arg => arg.startsWith('--')).map(arg => arg.slice(2));
    const unknown = given.filter(flag => !names.includes(flag) && !flags.includes(flag));

    if (unknown.length > 0) {
        log(`Unknown flag(s): ${unknown.join(', ')}. Kits: ${names.join(', ')}. Flags: ${flags.join(', ') || 'none'}`, 'red');
        process.exit(1);
    }

    const kits = given.filter(flag => names.includes(flag));

    return {
        kits: kits.length > 0 ? kits : names,
        flags: Object.fromEntries(flags.map(flag => [flag, given.includes(flag)])),
    };
}

export function normalizePath(relativePath) {
    return relativePath.replace(/\\/g, '/');
}

/**
 * The most specific smial that already owns the file, or the kit's top smial for new files.
 */
export function owningSmial(relativePath, smials, root = smialsDir) {
    for (let i = smials.length - 1; i >= 0; i--) {
        if (fs.existsSync(path.join(root, smials[i], relativePath))) {
            return smials[i];
        }
    }

    return smials[smials.length - 1];
}

export function isTeamSmial(smial) {
    return smial === 'teams' || smial.startsWith('teams-');
}

/**
 * The team smial that overrides a base smial: teams-<base> when the kit lists it, otherwise teams.
 */
export function teamSmialFor(baseSmial, smials) {
    return smials.includes(`teams-${baseSmial}`) ? `teams-${baseSmial}` : 'teams';
}

/**
 * Where a tended file lands. A team kit never edits a base smial: a file a base smial owns is overridden in the
 * team smial instead, and `overrides` names the base smial that was shadowed.
 */
export function tendTarget(relativePath, kit, root = smialsDir) {
    const owner = owningSmial(relativePath, kit.smials, root);

    if (!kit.base || isTeamSmial(owner)) {
        return { smial: owner, overrides: null };
    }

    return { smial: teamSmialFor(owner, kit.smials), overrides: owner };
}

/**
 * The smial a deleted file is removed from, or null when a team kit would have to delete a base smial's file.
 */
export function deleteTarget(relativePath, kit, root = smialsDir) {
    const owner = owningSmial(relativePath, kit.smials, root);

    return kit.base && !isTeamSmial(owner) ? null : owner;
}

export function sha1Of(file) {
    return createHash('sha1').update(fs.readFileSync(file)).digest('hex');
}

/**
 * The ledger of team smial files that override a base smial file, keyed "<teamSmial>/<path>".
 */
export function loadOverrides() {
    return fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, 'utf-8')) : {};
}

export function saveOverrides(overrides) {
    const sorted = Object.fromEntries(Object.entries(overrides).sort(([a], [b]) => a.localeCompare(b)));

    fs.writeFileSync(overridesFile, `${JSON.stringify(sorted, null, 4)}\n`);
}

/**
 * Record the base file a team file overrides, so a later change to the base file is flagged for review.
 */
export function recordOverride(teamSmial, relativePath, baseSmial) {
    const overrides = loadOverrides();

    overrides[`${teamSmial}/${relativePath}`] = { base: baseSmial, sha1: sha1Of(path.join(smialsDir, baseSmial, relativePath)) };
    saveOverrides(overrides);
}

/**
 * Reverse the raise time replacements so a synced file keeps its {{placeholders}}.
 * Only lines that contain a placeholder in the smial's copy are restored, which keeps
 * unrelated occurrences of values such as "vue" untouched.
 */
export function restoreReplacements(content, smialFile, replacements) {
    if (!fs.existsSync(smialFile)) {
        return content;
    }

    const templateLines = fs.readFileSync(smialFile, 'utf-8').split('\n').filter(line => /\{\{\w+\}\}/.test(line));
    let restored = content;

    for (const template of templateLines) {
        let rendered = template;

        for (const [placeholder, value] of Object.entries(replacements)) {
            rendered = rendered.split(placeholder).join(value);
        }

        restored = restored.split(rendered).join(template);
    }

    return restored;
}

/**
 * Raise a kit into raised/<kit> and install its PHP dependencies. Returns the kit's directory.
 */
export async function prepareKit(name) {
    const dir = path.join(raisedDir, name);

    await run('php', ['artisan', 'raise', `--kit=${name}`], { cwd: rootDir });

    if (!fs.existsSync(path.join(dir, '.env'))) {
        fs.copyFileSync(path.join(dir, '.env.example'), path.join(dir, '.env'));
    }

    // The lock's content hash covers composer.json, which raising personalises per kit.
    await run('composer', ['update', '--lock', '--no-interaction', '--no-progress'], { cwd: dir });
    await run('composer', ['install', '--no-interaction', '--no-progress'], { cwd: dir });

    return dir;
}

export function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', ...options });

        child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))));
        child.on('error', reject);
    });
}
