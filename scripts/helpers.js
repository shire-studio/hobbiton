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

/**
 * Kits without a base, which are the ones with a repository of their own.
 */
export function baseKitNames(manifest) {
    return Object.keys(manifest.kits).filter(name => !manifest.kits[name].base);
}

/**
 * The team kit of each given base kit, in the order given. Kits without a team kit add nothing.
 */
export function teamKitsFor(names, manifest) {
    return names.flatMap(name => Object.keys(manifest.kits).filter(kit => manifest.kits[kit].base === name));
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
 * The team kits in the manifest.
 */
export function teamKitsIn(manifest) {
    return Object.values(manifest.kits).filter(kit => kit.base);
}

/**
 * The team smial that overrides a base smial: teams-<base> when the kit lists it, otherwise teams when every team kit
 * raises the base smial. Returns null when only some team kits raise it, because an override in teams would leak into
 * the team kits that do not.
 */
export function teamSmialFor(baseSmial, smials, teamKits) {
    if (smials.includes(`teams-${baseSmial}`)) {
        return `teams-${baseSmial}`;
    }

    return teamKits.every(teamKit => teamKit.smials.includes(baseSmial)) ? 'teams' : null;
}

/**
 * Where a tended file lands. A team kit never edits a base smial: a file a base smial owns is overridden in the
 * team smial instead, and `overrides` names the base smial that was shadowed. `smial` is null when no team smial
 * can take the override (see teamSmialFor).
 */
export function tendTarget(relativePath, kit, root = smialsDir, teamKits = teamKitsIn(loadManifest())) {
    const owner = owningSmial(relativePath, kit.smials, root);

    if (!kit.base || isTeamSmial(owner)) {
        return { smial: owner, overrides: null };
    }

    return { smial: teamSmialFor(owner, kit.smials, teamKits), overrides: owner };
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
 * What tending an edited kit file would do. The edit is compared with the file the kit currently raises (the
 * owning smial's copy), so a base owned file the kit left alone is not overridden. A first override has no team copy
 * yet, so the shadowed base file supplies the {{placeholders}} to restore. `smial` and `destination` are null when no
 * team smial can take the override.
 */
export function tendChange(relativePath, edited, kit, { restore = false, root = smialsDir, teamKits = teamKitsIn(loadManifest()) } = {}) {
    const { smial, overrides } = tendTarget(relativePath, kit, root, teamKits);
    const current = path.join(root, owningSmial(relativePath, kit.smials, root), relativePath);
    const destination = smial === null ? null : path.join(root, smial, relativePath);
    const template = destination !== null && fs.existsSync(destination) ? destination : current;
    const source = restore ? Buffer.from(restoreReplacements(edited.toString('utf-8'), template, kit.replacements)) : edited;
    const changed = !fs.existsSync(current) || !fs.readFileSync(current).equals(source);

    return { smial, overrides, destination, source, changed };
}

function filesIn(directory) {
    if (!fs.existsSync(directory)) {
        return [];
    }

    return fs.readdirSync(directory, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => normalizePath(path.relative(directory, path.join(entry.parentPath, entry.name))));
}

/**
 * The base smials each effective team file shadows, keyed "<teamSmial>/<path>". A team file is effective in a kit
 * when its smial is the last in the kit's order to hold the path, and a file with no base copy is new, not an override.
 * Mirrors App\Support\TeamOverrides.
 */
export function effectiveOverrides(manifest, root = smialsDir) {
    const owners = new Map();

    for (const kit of Object.values(manifest.kits).filter(kit => kit.base)) {
        for (const smial of kit.smials.filter(isTeamSmial)) {
            for (const relativePath of filesIn(path.join(root, smial))) {
                const holders = kit.smials.filter(candidate => fs.existsSync(path.join(root, candidate, relativePath)));
                const bases = holders.filter(holder => !isTeamSmial(holder));

                if (holders.at(-1) !== smial || bases.length === 0) {
                    continue;
                }

                const key = `${smial}/${relativePath}`;
                owners.set(key, new Set([...(owners.get(key) ?? []), bases.at(-1)]));
            }
        }
    }

    return owners;
}

/**
 * Compare the ledger with the smials. Returns the messages for what is missing or stale and the ledger as accepting
 * would leave it: missing entries added, stale ones refreshed, and entries whose files no longer exist dropped.
 */
export function reconcileOverrides(manifest, ledger, root = smialsDir) {
    const messages = [];
    const accepted = {};

    for (const [key, entry] of Object.entries(ledger)) {
        const relativePath = key.split('/').slice(1).join('/');
        const baseFile = path.join(root, entry.base, relativePath);

        if (!fs.existsSync(path.join(root, key)) || !fs.existsSync(baseFile)) {
            messages.push(`${key} no longer overrides smials/${entry.base}`);
        } else {
            accepted[key] = entry;
        }
    }

    for (const [key, bases] of effectiveOverrides(manifest, root)) {
        const relativePath = key.split('/').slice(1).join('/');

        if (bases.size > 1) {
            messages.push(`${key} has an ambiguous base: ${[...bases].join(', ')}`);

            continue;
        }

        const [base] = bases;
        const current = sha1Of(path.join(root, base, relativePath));
        const entry = accepted[key];

        if (!entry) {
            messages.push(`${key} overrides smials/${base} but is not in team-overrides.json`);
        } else if (entry.base !== base || entry.sha1 !== current) {
            messages.push(`${key} is behind smials/${base}`);
        } else {
            continue;
        }

        accepted[key] = { base, sha1: current };
    }

    return { messages, accepted };
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
