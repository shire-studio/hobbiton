import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { baseKitNames, deleteTarget, owningSmial, refusedCount, teamKitsIn, teamSmialFor, tendChange, tendTarget, teamKitsFor } from '../../scripts/helpers.js';

const smials = ['common', 'auth', 'api', 'teams', 'teams-api'];
const kit = { base: 'api', smials };
const teamKits = [kit, { base: 'vue', smials: ['common', 'auth', 'web', 'inertia', 'inertia-vue', 'teams'] }];

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

test('teamSmialFor uses teams-<base> when the kit lists it', () => {
    assert.equal(teamSmialFor('api', smials, teamKits), 'teams-api');
});

test('teamSmialFor falls back to teams for a smial every team kit raises', () => {
    assert.equal(teamSmialFor('auth', smials, teamKits), 'teams');
    assert.equal(teamSmialFor('common', smials, teamKits), 'teams');
});

test('teamSmialFor refuses a smial only some team kits raise', () => {
    const vueTeams = teamKits[1];

    assert.equal(teamSmialFor('web', vueTeams.smials, teamKits), null);
    assert.equal(teamSmialFor('inertia', vueTeams.smials, teamKits), null);
});

test('tendTarget refuses to override a smial only some team kits raise', () => {
    const root = buildRoot([['web', 'routes/web.php']]);

    assert.deepEqual(tendTarget('routes/web.php', teamKits[1], root, teamKits), { smial: null, overrides: 'web' });
});

test('tendChange writes nothing for a smial only some team kits raise', () => {
    const root = buildRoot([['web', 'routes/web.php', 'base']]);
    const result = tendChange('routes/web.php', Buffer.from('edited'), teamKits[1], { root, teamKits });

    assert.equal(result.changed, true);
    assert.equal(result.smial, null);
    assert.equal(result.destination, null);
    assert.equal(result.overrides, 'web');
});

test('teamKitsIn returns the kits that have a base', () => {
    const manifest = { kits: { api: { smials: ['api'] }, 'api-teams': kit } };

    assert.deepEqual(teamKitsIn(manifest), [kit]);
});

test('tendTarget overrides base owned files in the team smial', () => {
    const root = buildRoot([['auth', 'app/Models/User.php']]);

    assert.deepEqual(tendTarget('app/Models/User.php', kit, root, teamKits), { smial: 'teams', overrides: 'auth' });
});

test('tendTarget keeps team owned files in place', () => {
    const root = buildRoot([['auth', 'app/Models/User.php'], ['teams-api', 'app/Models/User.php']]);

    assert.deepEqual(tendTarget('app/Models/User.php', kit, root, teamKits), { smial: 'teams-api', overrides: null });
});

test('tendTarget sends new files to the top smial', () => {
    const root = buildRoot([]);

    assert.deepEqual(tendTarget('app/Models/Team.php', kit, root, teamKits), { smial: 'teams-api', overrides: null });
});

test('tendTarget leaves base kits unchanged', () => {
    const root = buildRoot([['auth', 'app/Models/User.php']]);
    const base = { smials: ['common', 'auth', 'api'] };

    assert.deepEqual(tendTarget('app/Models/User.php', base, root, teamKits), {
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
    const result = tendChange('app/Models/User.php', Buffer.from('base'), kit, { root, teamKits });

    assert.equal(result.changed, false);
    assert.equal(result.overrides, 'auth');
});

test('tendChange overrides a changed base owned file in the team smial', () => {
    const root = buildRoot([['auth', 'app/Models/User.php', 'base']]);
    const result = tendChange('app/Models/User.php', Buffer.from('edited'), kit, { root, teamKits });

    assert.equal(result.changed, true);
    assert.equal(result.smial, 'teams');
    assert.equal(result.overrides, 'auth');
    assert.equal(result.destination, path.join(root, 'teams', 'app/Models/User.php'));
    assert.equal(result.source.toString(), 'edited');
});

test('tendChange compares team owned files with the team copy', () => {
    const root = buildRoot([['auth', 'app/Models/User.php', 'base'], ['teams-api', 'app/Models/User.php', 'team']]);

    assert.equal(tendChange('app/Models/User.php', Buffer.from('team'), kit, { root, teamKits }).changed, false);

    const changed = tendChange('app/Models/User.php', Buffer.from('base'), kit, { root, teamKits });

    assert.equal(changed.changed, true);
    assert.equal(changed.smial, 'teams-api');
    assert.equal(changed.overrides, null);
});

test('tendChange treats a new file as changed', () => {
    const root = buildRoot([]);

    assert.equal(tendChange('app/Models/Team.php', Buffer.from('new'), kit, { root, teamKits }).changed, true);
});

test('tendChange restores placeholders from the shadowed base file on a first override', () => {
    const root = buildRoot([['common', 'composer.json', '"name": "{{kit}}"\n"x": 1']]);
    const teamKit = { ...kit, replacements: { '{{kit}}': 'api' } };

    const unchanged = tendChange('composer.json', Buffer.from('"name": "api"\n"x": 1'), teamKit, { root, restore: true, teamKits });
    const changed = tendChange('composer.json', Buffer.from('"name": "api"\n"x": 2'), teamKit, { root, restore: true, teamKits });

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

test('tend --once exits 1 when it refuses a file', () => {
    const refused = { changed: true, smial: null };
    const tended = { changed: true, smial: 'teams' };
    const unchanged = { changed: false, smial: 'teams' };

    assert.equal(refusedCount([tended, unchanged]), 0);
    assert.equal(refusedCount([tended, refused, refused]), 2);
});
