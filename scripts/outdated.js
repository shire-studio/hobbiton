/**
 * Majors, deliberate holds and the report, for harvest.
 *
 * A finding is { name, from, to, kit }. A major is a semver major or a minor of a 0.x package, and
 * a hold is any Composer constraint that is not a caret range (or an npm catalog pin). Harvest
 * applies neither, it only reports them.
 *
 * pnpm-workspace.yaml is small and machine written, so it is read line by line rather than with a YAML parser.
 */

const unquote = value => value.trim().replace(/^'(.*)'$/, '$1');
const bare = version => version.replace(/^[\^~]/, '');

/**
 * The selected kits plus every sibling when any sibling is selected, in manifest order. The Inertia kits share
 * composer.json and vet.json, so updating one of them alone would leave the others' locks behind.
 */
export function withSiblings(selected, names, siblings) {
    const expanded = selected.some(name => siblings.includes(name)) ? [...selected, ...siblings] : selected;

    return names.filter(name => expanded.includes(name));
}

export function isHold(constraint) {
    return !constraint.startsWith('^') && !constraint.startsWith('dev-');
}

function constraintsOf(composerJson) {
    return { ...composerJson.require, ...composerJson['require-dev'] };
}

export function bumpablePackages(composerJson) {
    return Object.entries(constraintsOf(composerJson))
        .filter(([name, constraint]) => name !== 'php' && !name.startsWith('ext-') && !isHold(constraint) && !constraint.startsWith('dev-'))
        .map(([name]) => name)
        .sort();
}

export function composerFindings(composerJson, outdated, kit) {
    const constraints = constraintsOf(composerJson);
    const majors = [];
    const holds = [];

    for (const { name, version, latest, 'latest-status': status } of outdated.installed ?? []) {
        const finding = { name, from: version, to: latest, kit };

        if (constraints[name] !== undefined && isHold(constraints[name])) {
            latest !== version && holds.push(finding);
        } else if (status === 'update-possible') {
            majors.push(finding);
        }
    }

    return { majors, holds };
}

function packageJsonUpdates(taze) {
    return (taze.packages ?? []).filter(entry => entry.type === 'package.json').flatMap(entry => entry.resolved ?? []);
}

const isZeroMinor = ({ diff, currentVersion }) => diff === 'minor' && bare(currentVersion).split('.')[0] === '0';

export function npmZeroMinors(taze) {
    return packageJsonUpdates(taze).filter(isZeroMinor).map(({ name }) => name);
}

export function npmMajors(taze, kit) {
    return packageJsonUpdates(taze)
        .filter(update => update.diff === 'major' || isZeroMinor(update))
        .map(({ name, currentVersion, targetVersion }) => ({ name, from: bare(currentVersion), to: bare(targetVersion), kit }));
}

/**
 * The lines indented under a top level key, such as `catalog:` or `minimumReleaseAgeExclude:`.
 */
function block(yaml, key) {
    const lines = [];
    let inside = false;

    for (const line of yaml.split('\n')) {
        if (/^\S/.test(line)) {
            inside = line.trim() === `${key}:`;
        } else if (inside && line.trim() !== '') {
            lines.push(line.trim());
        }
    }

    return lines;
}

export function catalogEntries(workspaceYaml) {
    return block(workspaceYaml, 'catalog').map(line => {
        const [key, ...rest] = line.split(': ');
        const spec = unquote(rest.join(': '));
        const alias = spec.match(/^npm:(@?[^@]+)@(.+)$/);

        return alias ? { name: alias[1], version: alias[2] } : { name: unquote(key), version: spec };
    });
}

export function staleExcludes(workspaceYaml, lockText) {
    return block(workspaceYaml, 'minimumReleaseAgeExclude')
        .map(line => unquote(line.replace(/^- /, '')))
        .filter(entry => ![`${entry}:`, `${entry}(`, `${entry}':`].some(needle => lockText.includes(needle)));
}

export function lockMismatches(locks) {
    const versions = {};

    for (const [kit, lock] of Object.entries(locks)) {
        for (const { name, version } of [...(lock.packages ?? []), ...(lock['packages-dev'] ?? [])]) {
            (versions[name] ??= {})[kit] = version;
        }
    }

    const kits = Object.keys(locks);

    return Object.keys(versions)
        .sort()
        .filter(name => kits.some(kit => versions[name][kit] !== versions[name][kits[0]]))
        .map(name => ({ name, versions: versions[name] }));
}

export function groupFindings(findings) {
    const groups = new Map();

    for (const { name, from, to, kit } of findings) {
        const key = `${name} ${from} ${to}`;

        groups.has(key) ? groups.get(key).kits.push(kit) : groups.set(key, { name, from, to, kits: [kit] });
    }

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function columns(rows) {
    const widths = [0, 1].map(column => Math.max(...rows.map(row => row[column].length)));

    return rows.map(([name, versions, kits]) => `${name.padEnd(widths[0])}   ${versions.padEnd(widths[1])}   ${kits}`).join('\n');
}

export function formatFindings(groups) {
    return columns(groups.map(({ name, from, to, kits }) => [name, `${from} → ${to}`, kits.join(', ')]));
}

export function formatHolds(groups) {
    return columns(groups.map(({ name, from, to, kits }) => [name, `held at ${from}, ${to} available`, kits.join(', ')]));
}
