/**
 * Vet trust files and composer locks, for harvest.
 *
 * A Vet grant is a version plus a content hash, so the same release has the same grant in every
 * kit. Harvest pools the grants approved during a run, seeds them into each later kit's vet.json,
 * and spots the releases the user declined by comparing the locks before and after an update.
 */

import fs from 'fs';

const SECTIONS = ['require', 'require-dev'];

export function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function writeTrust(file, trust) {
    fs.writeFileSync(file, `${JSON.stringify(trust, null, 4)}\n`);
}

export function lockVersions(lock) {
    const versions = new Map();

    for (const [key, dev] of [['packages', false], ['packages-dev', true]]) {
        for (const { name, version } of lock[key] ?? []) {
            versions.set(name, { version, dev });
        }
    }

    return versions;
}

export function grantsOf(trust) {
    const grants = new Map();

    for (const section of SECTIONS) {
        for (const [name, { version, hash }] of Object.entries(trust[section] ?? {})) {
            grants.set(name, { version, hash });
        }
    }

    return grants;
}

export function poolKey(name, version) {
    return `${name}@${version}`;
}

export function newGrants(before, after) {
    const previous = grantsOf(before);

    return [...grantsOf(after)]
        .filter(([name, { version, hash }]) => previous.get(name)?.version !== version || previous.get(name)?.hash !== hash)
        .map(([name, grant]) => ({ name, ...grant }));
}

/**
 * Write each pooled grant that matches a locked version into the section the lock puts it in.
 */
export function seedTrust(trust, lock, pool) {
    const grants = grantsOf(trust);
    const dev = new Map();

    for (const name of grants.keys()) {
        dev.set(name, trust['require-dev']?.[name] !== undefined);
    }

    for (const [name, locked] of lockVersions(lock)) {
        const pooled = pool.get(poolKey(name, locked.version));

        if (pooled && grants.get(name)?.version !== locked.version) {
            grants.set(name, { version: pooled.version, hash: pooled.hash });
            dev.set(name, locked.dev);
        }
    }

    return withGrants(trust, grants, dev);
}

export function pruneTrust(trust, lock) {
    const locked = lockVersions(lock);
    const grants = new Map([...grantsOf(trust)].filter(([name]) => locked.has(name)));
    const dev = new Map([...grants.keys()].map(name => [name, trust['require-dev']?.[name] !== undefined]));

    return withGrants(trust, grants, dev);
}

export function hasGrants(trust) {
    return grantsOf(trust).size > 0;
}

/**
 * Changed packages the trust file does not grant. Metapackages ship no files, so Vet never asks about them.
 */
export function rejectedPackages(oldLock, newLock, trust) {
    const previous = lockVersions(oldLock);
    const grants = grantsOf(trust);
    const metapackages = new Set([...(newLock.packages ?? []), ...(newLock['packages-dev'] ?? [])].filter(({ type }) => type === 'metapackage').map(({ name }) => name));

    return [...lockVersions(newLock)]
        .filter(([name, { version }]) => !metapackages.has(name) && previous.get(name)?.version !== version && grants.get(name)?.version !== version)
        .map(([name]) => name)
        .sort();
}

/**
 * Pin every locked package, so a sibling kit with the same composer.json resolves exactly the same versions.
 */
export function pinArguments(lock) {
    return [...lockVersions(lock)].flatMap(([name, { version }]) => ['--with', `${name}:${version}`]);
}

export function holdArguments(rejected, oldLock) {
    const previous = lockVersions(oldLock);
    const args = [];
    const unheld = [];

    for (const name of rejected) {
        previous.has(name) ? args.push('--with', `${name}:${previous.get(name).version}`) : unheld.push(name);
    }

    return { args, unheld };
}

function withGrants(trust, grants, dev) {
    const sections = { require: {}, 'require-dev': {} };

    for (const name of [...grants.keys()].sort()) {
        sections[dev.get(name) ? 'require-dev' : 'require'][name] = grants.get(name);
    }

    return { ...trust, ...sections };
}
