<?php

use App\Support\Manifest;
use App\Support\TeamOverrides;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->root = storage_path('framework/testing/overrides-'.uniqid());

    File::ensureDirectoryExists($this->root);
});

afterEach(function () {
    File::deleteDirectory($this->root);
});

function overridesFixture(string $root, array $files, array $kits = []): Manifest
{
    foreach ($files as $file => $contents) {
        File::ensureDirectoryExists(dirname("{$root}/{$file}"));
        File::put("{$root}/{$file}", $contents);
    }

    $kits = $kits ?: [
        'api' => ['smials' => ['common', 'auth', 'api']],
        'api-teams' => ['base' => 'api', 'smials' => ['common', 'auth', 'api', 'teams', 'teams-api']],
    ];

    return new Manifest($kits, []);
}

function entry(string $base, string $contents): array
{
    return ['base' => $base, 'sha1' => sha1($contents)];
}

it('accepts an override whose base file is unchanged', function () {
    $manifest = overridesFixture($this->root, [
        'auth/app/Models/User.php' => 'base',
        'teams/app/Models/User.php' => 'team',
    ]);

    expect(TeamOverrides::problems($manifest, $this->root, ['teams/app/Models/User.php' => entry('auth', 'base')]))->toBe([]);
});

it('fails when a base file changed after it was overridden', function () {
    $manifest = overridesFixture($this->root, [
        'auth/app/Models/User.php' => 'changed',
        'teams/app/Models/User.php' => 'team',
    ]);

    $problems = TeamOverrides::problems($manifest, $this->root, ['teams/app/Models/User.php' => entry('auth', 'base')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('teams/app/Models/User.php')->toContain('auth');
});

it('fails when an override is missing from the ledger', function () {
    $manifest = overridesFixture($this->root, [
        'auth/app/Models/User.php' => 'base',
        'teams/app/Models/User.php' => 'team',
    ]);

    $problems = TeamOverrides::problems($manifest, $this->root, []);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('teams/app/Models/User.php')->toContain('auth');
});

it('fails when the ledger lists a file that no longer exists', function () {
    $manifest = overridesFixture($this->root, ['auth/app/Models/User.php' => 'base']);

    $problems = TeamOverrides::problems($manifest, $this->root, ['teams/app/Models/User.php' => entry('auth', 'base')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('teams/app/Models/User.php');
});

it('fails when the base file of a ledger entry no longer exists', function () {
    $manifest = overridesFixture($this->root, ['teams/app/Models/User.php' => 'team']);

    $problems = TeamOverrides::problems($manifest, $this->root, ['teams/app/Models/User.php' => entry('auth', 'base')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('auth/app/Models/User.php');
});

it('pairs a team file with the base file it shadows in each kit', function () {
    $manifest = overridesFixture($this->root, [
        'auth/app/Models/User.php' => 'auth',
        'api/app/Models/User.php' => 'api',
        'teams-api/app/Models/User.php' => 'team',
    ]);

    expect(TeamOverrides::problems($manifest, $this->root, ['teams-api/app/Models/User.php' => entry('api', 'api')]))->toBe([]);
});

it('treats a team file without a base counterpart as a new file', function () {
    $manifest = overridesFixture($this->root, ['teams/app/Models/Team.php' => 'team']);

    expect(TeamOverrides::problems($manifest, $this->root, []))->toBe([]);
});

it('ignores a team file that another team smial replaces', function () {
    $manifest = overridesFixture($this->root, [
        'auth/app/Models/User.php' => 'base',
        'teams/app/Models/User.php' => 'team',
        'teams-api/app/Models/User.php' => 'team api',
    ]);

    expect(TeamOverrides::problems($manifest, $this->root, ['teams-api/app/Models/User.php' => entry('auth', 'base')]))->toBe([]);
});

it('reports an ambiguous base', function () {
    $manifest = overridesFixture($this->root, [
        'auth/app/Models/User.php' => 'auth',
        'web/app/Models/User.php' => 'web',
        'teams/app/Models/User.php' => 'team',
    ], [
        'a' => ['smials' => ['auth']],
        'a-teams' => ['base' => 'a', 'smials' => ['auth', 'teams']],
        'b' => ['smials' => ['auth', 'web']],
        'b-teams' => ['base' => 'b', 'smials' => ['auth', 'web', 'teams']],
    ]);

    $problems = TeamOverrides::problems($manifest, $this->root, ['teams/app/Models/User.php' => entry('web', 'web')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('ambiguous base')->toContain('teams/app/Models/User.php');
});

it("the repository's overrides are up to date", function () {
    $ledger = json_decode(File::get(base_path('team-overrides.json')), true, flags: JSON_THROW_ON_ERROR);

    expect(TeamOverrides::problems(Manifest::load(), base_path('smials'), $ledger))->toBe([]);
});
