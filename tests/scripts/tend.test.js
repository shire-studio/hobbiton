import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { deleteTarget, owningSmial, teamSmialFor, tendTarget } from '../../scripts/helpers.js';

const smials = ['common', 'auth', 'api', 'teams', 'teams-api'];
const kit = { base: 'api', smials };

function buildRoot(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hobbiton-tend-'));

    for (const [smial, relativePath] of files) {
        const file = path.join(root, smial, relativePath);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, 'x');
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
