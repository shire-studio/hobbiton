import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    bumpablePackages,
    catalogEntries,
    composerFindings,
    formatFindings,
    formatHolds,
    groupFindings,
    isHold,
    lockMismatches,
    npmMajors,
    npmZeroMinors,
    staleExcludes,
    withSiblings,
} from '../../scripts/outdated.js';

const workspace = `allowBuilds:
  vue-demi: true
minimumReleaseAgeExclude:
  - playwright-core@1.63.0
  - playwright@1.63.0
  - '@types/node@26.5.1'
catalog:
  vite: npm:@voidzero-dev/vite-plus-core@0.3.1
  vite-plus: 0.3.1
overrides:
  vite@*: 'catalog:'
  tinypool@<2.1.2: 2.1.2
`;

const taze = {
    packages: [
        { name: 'pnpm-catalog:default', type: 'pnpm-workspace.yaml', resolved: [{ name: 'vite-plus', currentVersion: '0.3.1', targetVersion: '1.0.0', diff: 'major' }] },
        {
            name: '',
            type: 'package.json',
            resolved: [
                { name: 'typescript', currentVersion: '^6.0.3', targetVersion: '^7.0.2', diff: 'major' },
                { name: '@laravel/multiplex', currentVersion: '^0.4.5', targetVersion: '^0.5.0', diff: 'minor' },
                { name: '@lucide/vue', currentVersion: '^1.59.0', targetVersion: '^1.61.0', diff: 'minor' },
            ],
        },
    ],
};

test('isHold treats anything but a caret or dev branch as a hold', () => {
    assert.equal(isHold('~13.34.0'), true);
    assert.equal(isHold('3.14.0'), true);
    assert.equal(isHold('^1.2.0'), false);
    assert.equal(isHold('dev-latest'), false);
});

test('bumpablePackages skips php, extensions, holds and dev branches', () => {
    const composerJson = {
        require: {
            php: '^8.5',
            'ext-zip': '*',
            'laravel/framework': '~13.34.0',
            'laravel/wayfinder': '^0.1.21',
            'roave/security-advisories': 'dev-latest',
        },
        'require-dev': { 'pestphp/pest': '^5.2.1' },
    };

    assert.deepEqual(bumpablePackages(composerJson), ['laravel/wayfinder', 'pestphp/pest']);
});

test('composerFindings splits holds from majors, including a 0.x minor', () => {
    const composerJson = {
        require: { 'laravel/framework': '~13.34.0', 'laravel/wayfinder': '^0.1.23' },
        'require-dev': { 'driftingly/rector-laravel': '^2.6.2' },
    };
    const outdated = {
        installed: [
            { name: 'laravel/framework', version: '13.34.2', latest: '13.38.0', 'latest-status': 'semver-safe-update' },
            { name: 'laravel/wayfinder', version: '0.1.23', latest: '0.2.0', 'latest-status': 'update-possible' },
            { name: 'driftingly/rector-laravel', version: '2.6.2', latest: '2.7.0', 'latest-status': 'semver-safe-update' },
        ],
    };

    assert.deepEqual(composerFindings(composerJson, outdated, 'vue'), {
        majors: [{ name: 'laravel/wayfinder', from: '0.1.23', to: '0.2.0', kit: 'vue' }],
        holds: [{ name: 'laravel/framework', from: '13.34.2', to: '13.38.0', kit: 'vue' }],
    });
});

test('npmMajors reports majors and 0.x minors from package.json only', () => {
    assert.deepEqual(npmMajors(taze, 'vue'), [
        { name: 'typescript', from: '6.0.3', to: '7.0.2', kit: 'vue' },
        { name: '@laravel/multiplex', from: '0.4.5', to: '0.5.0', kit: 'vue' },
    ]);
});

test('npmZeroMinors names the 0.x minors taze must not write', () => {
    assert.deepEqual(npmZeroMinors(taze), ['@laravel/multiplex']);
});

test('catalogEntries reads the catalog and resolves npm aliases', () => {
    assert.deepEqual(catalogEntries(workspace), [
        { name: '@voidzero-dev/vite-plus-core', version: '0.3.1' },
        { name: 'vite-plus', version: '0.3.1' },
    ]);
});

test('staleExcludes finds quoted and bare excludes the lock no longer holds', () => {
    const lockText = `packages:\n\n  '@types/node@26.5.1':\n    resolution: {}\n\n  playwright-core@1.63.0:\n    resolution: {}\n`;

    assert.deepEqual(staleExcludes(workspace, lockText), ['playwright@1.63.0']);
});

test('lockMismatches reports packages whose versions differ between locks', () => {
    const lock = version => ({ packages: [{ name: 'a', version }], 'packages-dev': [] });

    assert.deepEqual(lockMismatches({ vue: lock('1.0.0'), react: lock('1.0.1'), svelte: lock('1.0.0') }), [
        { name: 'a', versions: { vue: '1.0.0', react: '1.0.1', svelte: '1.0.0' } },
    ]);
    assert.deepEqual(lockMismatches({ vue: lock('1.0.0'), react: lock('1.0.0') }), []);
});

test('groupFindings merges the same bump across kits', () => {
    const groups = groupFindings([
        { name: 'vitest', from: '3.2.4', to: '4.0.1', kit: 'vue' },
        { name: '@inertiajs/vue3', from: '2.3.1', to: '3.0.0', kit: 'vue' },
        { name: 'vitest', from: '3.2.4', to: '4.0.1', kit: 'blade' },
    ]);

    assert.deepEqual(groups, [
        { name: '@inertiajs/vue3', from: '2.3.1', to: '3.0.0', kits: ['vue'] },
        { name: 'vitest', from: '3.2.4', to: '4.0.1', kits: ['vue', 'blade'] },
    ]);
});

test('formatFindings lines up name, versions and kits', () => {
    const text = formatFindings([
        { name: '@inertiajs/vue3', from: '2.3.1', to: '3.0.0', kits: ['vue'] },
        { name: 'vitest', from: '3.2.4', to: '4.0.1', kits: ['vue', 'blade'] },
    ]);

    assert.equal(text, '@inertiajs/vue3   2.3.1 → 3.0.0   vue\nvitest            3.2.4 → 4.0.1   vue, blade');
});

test('formatHolds lines up name, the held version and kits', () => {
    const text = formatHolds([
        { name: 'fidry/cpu-core-counter', from: '1.3.0', to: '1.4.1', kits: ['api'] },
        { name: 'laravel/framework', from: 'v13.34.0', to: 'v13.38.0', kits: ['api', 'vue'] },
    ]);

    assert.equal(
        text,
        'fidry/cpu-core-counter   held at 1.3.0, 1.4.1 available         api\nlaravel/framework        held at v13.34.0, v13.38.0 available   api, vue',
    );
});

test('withSiblings adds every Inertia kit when any of them is selected, in manifest order', () => {
    const names = ['vue', 'react', 'svelte', 'livewire', 'api', 'blade'];

    assert.deepEqual(withSiblings(['react', 'api'], names, ['vue', 'react', 'svelte']), ['vue', 'react', 'svelte', 'api']);
    assert.deepEqual(withSiblings(['api'], names, ['vue', 'react', 'svelte']), ['api']);
});
