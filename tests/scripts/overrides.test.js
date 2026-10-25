import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { effectiveOverrides, reconcileOverrides } from '../../scripts/helpers.js';

const manifest = {
    kits: {
        api: { smials: ['common', 'auth', 'api'] },
        'api-teams': { base: 'api', smials: ['common', 'auth', 'api', 'teams', 'teams-api'] },
    },
};

const roots = [];

after(() => roots.forEach(root => fs.rmSync(root, { recursive: true, force: true })));

function buildRoot(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hobbiton-overrides-'));
    roots.push(root);

    for (const [smial, relativePath, contents] of files) {
        const file = path.join(root, smial, relativePath);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, contents);
    }

    return root;
}

const sha1 = contents => createHash('sha1').update(contents).digest('hex');

test('effectiveOverrides pairs a team file with the last base smial holding it', () => {
    const root = buildRoot([['auth', 'a.php', 'auth'], ['api', 'a.php', 'api'], ['teams-api', 'a.php', 'team'], ['teams-api', 'new.php', 'new']]);

    assert.deepEqual([...effectiveOverrides(manifest, root)].map(([key, bases]) => [key, [...bases]]), [['teams-api/a.php', ['api']]]);
});

test('reconcileOverrides reports a missing entry and accepting adds it', () => {
    const root = buildRoot([['api', 'a.php', 'api'], ['teams-api', 'a.php', 'team']]);
    const { messages, accepted } = reconcileOverrides(manifest, {}, root);

    assert.equal(messages.length, 1);
    assert.match(messages[0], /teams-api\/a\.php .*not in team-overrides\.json/);
    assert.deepEqual(accepted, { 'teams-api/a.php': { base: 'api', sha1: sha1('api') } });
});

test('reconcileOverrides is quiet when the ledger is current', () => {
    const root = buildRoot([['api', 'a.php', 'api'], ['teams-api', 'a.php', 'team']]);
    const ledger = { 'teams-api/a.php': { base: 'api', sha1: sha1('api') } };
    const { messages, accepted } = reconcileOverrides(manifest, ledger, root);

    assert.deepEqual(messages, []);
    assert.deepEqual(accepted, ledger);
});

test('reconcileOverrides refreshes a stale entry', () => {
    const root = buildRoot([['api', 'a.php', 'changed'], ['teams-api', 'a.php', 'team']]);
    const { messages, accepted } = reconcileOverrides(manifest, { 'teams-api/a.php': { base: 'api', sha1: sha1('api') } }, root);

    assert.equal(messages.length, 1);
    assert.equal(accepted['teams-api/a.php'].sha1, sha1('changed'));
});

test('reconcileOverrides treats a missing base file as stale and drops the entry', () => {
    const root = buildRoot([['teams-api', 'a.php', 'team']]);
    const { messages, accepted } = reconcileOverrides(manifest, { 'teams-api/a.php': { base: 'api', sha1: 'x' } }, root);

    assert.equal(messages.length, 1);
    assert.deepEqual(accepted, {});
});

test('reconcileOverrides drops an entry whose team file is gone', () => {
    const root = buildRoot([['api', 'a.php', 'api']]);
    const { messages, accepted } = reconcileOverrides(manifest, { 'teams-api/a.php': { base: 'api', sha1: sha1('api') } }, root);

    assert.equal(messages.length, 1);
    assert.deepEqual(accepted, {});
});
