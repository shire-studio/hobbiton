import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { baseKitNames, deleteTarget, owningSmial, teamSmialFor, tendChange, tendTarget, teamKitsFor } from '../../scripts/helpers.js';

const smials = ['common', 'auth', 'api', 'teams', 'teams-api'];
const kit = { base: 'api', smials };

const roots = [];

after(() => roots.forEach(root => fs.rmSync(root, { recursive: true, force: true })));

function buildRoot(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hobbiton-tend-'));
    roots.push(root);

    for (const [smial, relativePath, contents = 'x'] of files) {
        const file = path.join(root, smial, relativePath);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, contents);
    }

    return root;
}

test('teamSmialFor maps a base smial to its team smial', () => {
    assert.equal(teamSmialFor('api', smials), 'teams-api');
    assert.equal(teamSmialFor('auth', smials), 'teams');
    assert.equal(teamSmialFor('web', smials), 'teams');
});

test('tendTarget overrides base owned files in the team smial', () => {
    const root = buildRoot([['auth', 'app/Models/User.php']]);

    assert.deepEqual(tendTarget('app/Models/User.php', kit, root), { smial: 'teams', overrides: 'auth' });
});

test('tendTarget keeps team owned files in place', () => {
    const root = buildRoot([['auth', 'app/Models/User.php'], ['teams-api', 'app/Models/User.php']]);

    assert.deepEqual(tendTarget('app/Models/User.php', kit, root), { smial: 'teams-api', overrides: null });
});

test('tendTarget sends new files to the top smial', () => {
    const root = buildRoot([]);

    assert.deepEqual(tendTarget('app/Models/Team.php', kit, root), { smial: 'teams-api', overrides: null });
});

test('tendTarget leaves base kits unchanged', () => {
    const root = buildRoot([['auth', 'app/Models/User.php']]);
    const base = { smials: ['common', 'auth', 'api'] };

    assert.deepEqual(tendTarget('app/Models/User.php', base, root), {
        smial: owningSmial('app/Models/User.php', base.smials, root),
        overrides: null,
    });
});

test('deleteTarget refuses base owned files', () => {
    const root = buildRoot([['auth', 'app/Models/User.php'], ['teams', 'app/Models/Team.php']]);

    assert.equal(deleteTarget('app/Models/User.php', kit, root), null);
    assert.equal(deleteTarget('app/Models/Team.php', kit, root), 'teams');
});

test('tendChange does not override an unchanged base owned file', () => {
    const root = buildRoot([['auth', 'app/Models/User.php', 'base']]);
    const result = tendChange('app/Models/User.php', Buffer.from('base'), kit, { root });

    assert.equal(result.changed, false);
    assert.equal(result.overrides, 'auth');
});

test('tendChange overrides a changed base owned file in the team smial', () => {
    const root = buildRoot([['auth', 'app/Models/User.php', 'base']]);
    const result = tendChange('app/Models/User.php', Buffer.from('edited'), kit, { root });

    assert.equal(result.changed, true);
    assert.equal(result.smial, 'teams');
    assert.equal(result.overrides, 'auth');
    assert.equal(result.destination, path.join(root, 'teams', 'app/Models/User.php'));
    assert.equal(result.source.toString(), 'edited');
});

test('tendChange compares team owned files with the team copy', () => {
    const root = buildRoot([['auth', 'app/Models/User.php', 'base'], ['teams-api', 'app/Models/User.php', 'team']]);

    assert.equal(tendChange('app/Models/User.php', Buffer.from('team'), kit, { root }).changed, false);

    const changed = tendChange('app/Models/User.php', Buffer.from('base'), kit, { root });

    assert.equal(changed.changed, true);
    assert.equal(changed.smial, 'teams-api');
    assert.equal(changed.overrides, null);
});

test('tendChange treats a new file as changed', () => {
    const root = buildRoot([]);

    assert.equal(tendChange('app/Models/Team.php', Buffer.from('new'), kit, { root }).changed, true);
});

test('tendChange restores placeholders from the shadowed base file on a first override', () => {
    const root = buildRoot([['common', 'composer.json', '"name": "{{kit}}"\n"x": 1']]);
    const teamKit = { ...kit, replacements: { '{{kit}}': 'api' } };

    const unchanged = tendChange('composer.json', Buffer.from('"name": "api"\n"x": 1'), teamKit, { root, restore: true });
    const changed = tendChange('composer.json', Buffer.from('"name": "api"\n"x": 2'), teamKit, { root, restore: true });

    assert.equal(unchanged.changed, false);
    assert.equal(changed.changed, true);
    assert.equal(changed.source.toString(), '"name": "{{kit}}"\n"x": 2');
});

const manifest = { kits: { api: {}, vue: {}, 'api-teams': { base: 'api' } } };

test('baseKitNames leaves out team kits', () => {
    assert.deepEqual(baseKitNames(manifest), ['api', 'vue']);
});

test('teamKitsFor returns the team kit of each base kit that has one', () => {
    assert.deepEqual(teamKitsFor(['vue', 'api'], manifest), ['api-teams']);
    assert.deepEqual(teamKitsFor(['vue'], manifest), []);
});
