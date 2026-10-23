import assert from 'node:assert/strict';
import { test } from 'node:test';
import { holdArguments, lockVersions, newGrants, poolKey, pruneTrust, rejectedPackages, seedTrust } from '../../scripts/trust.js';

const lock = (packages, dev = []) => ({
    packages: Object.entries(packages).map(([name, version]) => ({ name, version })),
    'packages-dev': Object.entries(dev).map(([name, version]) => ({ name, version })),
});

const grant = (version, hash = `tree-v2:${version}`) => ({ version, hash });

test('lockVersions marks packages-dev as dev', () => {
    const versions = lockVersions(lock({ 'acme/app': '1.0.0' }, { 'acme/test': '2.0.0' }));

    assert.deepEqual(versions.get('acme/app'), { version: '1.0.0', dev: false });
    assert.deepEqual(versions.get('acme/test'), { version: '2.0.0', dev: true });
});

test('newGrants returns only grants whose version or hash changed', () => {
    const before = { require: { a: grant('1.0.0'), b: grant('1.0.0') }, 'require-dev': {} };
    const after = { require: { a: grant('1.1.0'), b: grant('1.0.0') }, 'require-dev': {} };

    assert.deepEqual(newGrants(before, after), [{ name: 'a', ...grant('1.1.0') }]);
});

test('seedTrust writes a pooled grant into the section the target lock uses', () => {
    const pool = new Map([[poolKey('acme/tool', '2.0.0'), { name: 'acme/tool', version: '2.0.0', hash: 'h' }]]);
    const trust = { require: { 'acme/tool': grant('1.0.0') }, 'require-dev': {} };

    const seeded = seedTrust(trust, lock({}, { 'acme/tool': '2.0.0' }), pool);

    assert.deepEqual(seeded['require-dev']['acme/tool'], { version: '2.0.0', hash: 'h' });
    assert.equal(seeded.require['acme/tool'], undefined);
});

test('seedTrust ignores other versions and packages the lock does not hold', () => {
    const pool = new Map([
        [poolKey('acme/tool', '3.0.0'), { name: 'acme/tool', version: '3.0.0', hash: 'h3' }],
        [poolKey('other/pkg', '1.0.0'), { name: 'other/pkg', version: '1.0.0', hash: 'h1' }],
    ]);
    const trust = {
        require: { 'acme/tool': grant('1.0.0') },
        'require-dev': {},
        'minimum-release-age': 2,
        'minimum-release-age-exclude': ['roave/security-advisories'],
    };

    const seeded = seedTrust(trust, lock({ 'acme/tool': '2.0.0' }), pool);

    assert.deepEqual(seeded.require, { 'acme/tool': grant('1.0.0') });
    assert.equal(seeded['minimum-release-age'], 2);
    assert.deepEqual(seeded['minimum-release-age-exclude'], ['roave/security-advisories']);
});

test('pruneTrust drops grants the lock no longer holds and keeps keys sorted', () => {
    const trust = { require: { 'z/pkg': grant('1.0.0'), 'gone/pkg': grant('1.0.0'), 'a/pkg': grant('1.0.0') }, 'require-dev': {} };

    const pruned = pruneTrust(trust, lock({ 'a/pkg': '1.0.0', 'z/pkg': '1.0.0' }));

    assert.deepEqual(Object.keys(pruned.require), ['a/pkg', 'z/pkg']);
});

test('rejectedPackages lists changed packages the trust file does not grant', () => {
    const oldLock = lock({ a: '1.0.0', b: '1.0.0' });
    const newLock = lock({ a: '1.1.0', b: '1.0.0', c: '1.0.0' });
    const trust = { require: { a: grant('1.1.0'), b: grant('1.0.0') }, 'require-dev': {} };

    assert.deepEqual(rejectedPackages(oldLock, newLock, trust), ['c']);
});

test('rejectedPackages counts every change as rejected when nothing was ticked', () => {
    const oldLock = lock({ a: '1.0.0', b: '1.0.0' });
    const newLock = lock({ a: '1.1.0', b: '1.0.0', c: '1.0.0' });

    assert.deepEqual(rejectedPackages(oldLock, newLock, { require: {}, 'require-dev': {} }), ['a', 'c']);
});

test('holdArguments holds rejected packages at their old version and reports new ones as unheld', () => {
    assert.deepEqual(holdArguments(['a', 'c'], lock({ a: '1.0.0', b: '1.0.0' })), {
        args: ['--with', 'a:1.0.0'],
        unheld: ['c'],
    });
});
