import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inheritBases, loadManifest } from '../../scripts/helpers.js';

const manifest = {
    kits: {
        api: { label: 'API', repository: 'x/api', node: false, smials: ['api'], exclude: ['routes/web.php'], replacements: { '{{kit}}': 'api' } },
        'api-teams': { label: 'API Teams', base: 'api', smials: ['api', 'teams'], exclude: ['config/teams.php'] },
        blade: { label: 'Blade', repository: 'x/blade', node: true, smials: ['blade'], replacements: { '{{kit}}': 'blade' } },
        'blade-teams': { label: 'Blade Teams', base: 'blade', smials: ['blade', 'teams'] },
    },
    replacementPaths: ['composer.json'],
};

test('inheritBases gives a team kit its base kit\'s repository, node and replacements', () => {
    const { kits } = inheritBases(manifest);

    assert.equal(kits['api-teams'].repository, 'x/api');
    assert.equal(kits['api-teams'].node, false);
    assert.deepEqual(kits['api-teams'].replacements, { '{{kit}}': 'api' });
    assert.equal(kits['blade-teams'].node, true);
});

test('inheritBases adds a team kit\'s exclude to its base kit\'s', () => {
    const { kits } = inheritBases(manifest);

    assert.deepEqual(kits['api-teams'].exclude, ['routes/web.php', 'config/teams.php']);
    assert.deepEqual(kits['blade-teams'].exclude, []);
});

test('inheritBases leaves base kits and the rest of the manifest alone', () => {
    const inherited = inheritBases(manifest);

    assert.deepEqual(inherited.kits.api, manifest.kits.api);
    assert.deepEqual(inherited.kits.blade, manifest.kits.blade);
    assert.deepEqual(inherited.replacementPaths, manifest.replacementPaths);
});

test('inheritBases refuses an unknown base', () => {
    assert.throws(() => inheritBases({ kits: { 'x-teams': { base: 'x', smials: [] } } }), /x-teams has an unknown base x/);
});

test('loadManifest fills in every team kit from its base kit', () => {
    const { kits } = loadManifest();

    for (const kit of Object.values(kits).filter(kit => kit.base)) {
        assert.equal(kit.repository, kits[kit.base].repository);
        assert.equal(kit.node, kits[kit.base].node);
    }
});
