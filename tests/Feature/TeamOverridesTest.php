<?php

use App\Support\Manifest;
use App\Support\TeamOverrides;
use Illuminate\Support\Facades\File;

$GLOBALS['overridesFixtures'] = [];

afterEach(function () {
    foreach ($GLOBALS['overridesFixtures'] as $path) {
        File::deleteDirectory($path);
    }

    $GLOBALS['overridesFixtures'] = [];
});

function overridesFixture(array $files, array $kits = []): array
{
    $path = sys_get_temp_dir().'/hobbiton-overrides-'.uniqid();
    $GLOBALS['overridesFixtures'][] = $path;

    foreach ($files as $file => $contents) {
        File::ensureDirectoryExists(dirname("{$path}/{$file}"));
        File::put("{$path}/{$file}", $contents);
    }

    $kits = $kits ?: [
        'api' => ['smials' => ['common', 'auth', 'api']],
        'api-teams' => ['base' => 'api', 'smials' => ['common', 'auth', 'api', 'teams', 'teams-api']],
    ];

    return [new Manifest($kits, []), $path];
}

function entry(string $base, string $contents): array
{
    return ['base' => $base, 'sha1' => sha1($contents)];
}

it('accepts an override whose base file is unchanged', function () {
    [$manifest, $path] = overridesFixture([
        'auth/app/Models/User.php' => 'base',
        'teams/app/Models/User.php' => 'team',
    ]);

    expect(TeamOverrides::problems($manifest, $path, ['teams/app/Models/User.php' => entry('auth', 'base')]))->toBe([]);
});

it('fails when a base file changed after it was overridden', function () {
    [$manifest, $path] = overridesFixture([
        'auth/app/Models/User.php' => 'changed',
        'teams/app/Models/User.php' => 'team',
    ]);

    $problems = TeamOverrides::problems($manifest, $path, ['teams/app/Models/User.php' => entry('auth', 'base')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('teams/app/Models/User.php')->toContain('auth');
});

it('fails when an override is missing from the ledger', function () {
    [$manifest, $path] = overridesFixture([
        'auth/app/Models/User.php' => 'base',
        'teams/app/Models/User.php' => 'team',
    ]);

    $problems = TeamOverrides::problems($manifest, $path, []);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('teams/app/Models/User.php')->toContain('auth');
});

it('fails when the ledger lists a file that no longer exists', function () {
    [$manifest, $path] = overridesFixture(['auth/app/Models/User.php' => 'base']);

    $problems = TeamOverrides::problems($manifest, $path, ['teams/app/Models/User.php' => entry('auth', 'base')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('teams/app/Models/User.php');
});

it('fails when the base file of a ledger entry no longer exists', function () {
    [$manifest, $path] = overridesFixture(['teams/app/Models/User.php' => 'team']);

    $problems = TeamOverrides::problems($manifest, $path, ['teams/app/Models/User.php' => entry('auth', 'base')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('auth/app/Models/User.php');
});

it('pairs a team file with the base file it shadows in each kit', function () {
    [$manifest, $path] = overridesFixture([
        'auth/app/Models/User.php' => 'auth',
        'api/app/Models/User.php' => 'api',
        'teams-api/app/Models/User.php' => 'team',
    ]);

    expect(TeamOverrides::problems($manifest, $path, ['teams-api/app/Models/User.php' => entry('api', 'api')]))->toBe([]);
});

it('treats a team file without a base counterpart as a new file', function () {
    [$manifest, $path] = overridesFixture(['teams/app/Models/Team.php' => 'team']);

    expect(TeamOverrides::problems($manifest, $path, []))->toBe([]);
});

it('ignores a team file that another team smial replaces', function () {
    [$manifest, $path] = overridesFixture([
        'auth/app/Models/User.php' => 'base',
        'teams/app/Models/User.php' => 'team',
        'teams-api/app/Models/User.php' => 'team api',
    ]);

    expect(TeamOverrides::problems($manifest, $path, ['teams-api/app/Models/User.php' => entry('auth', 'base')]))->toBe([]);
});

it('reports an ambiguous base', function () {
    [$manifest, $path] = overridesFixture([
        'auth/app/Models/User.php' => 'auth',
        'web/app/Models/User.php' => 'web',
        'teams/app/Models/User.php' => 'team',
    ], [
        'a' => ['smials' => ['auth']],
        'a-teams' => ['base' => 'a', 'smials' => ['auth', 'teams']],
        'b' => ['smials' => ['auth', 'web']],
        'b-teams' => ['base' => 'b', 'smials' => ['auth', 'web', 'teams']],
    ]);

    $problems = TeamOverrides::problems($manifest, $path, ['teams/app/Models/User.php' => entry('web', 'web')]);

    expect($problems)->toHaveCount(1)
        ->and($problems[0])->toContain('ambiguous base')->toContain('teams/app/Models/User.php');
});

it("the repository's overrides are up to date", function () {
    $ledger = json_decode(File::get(base_path('team-overrides.json')), true, flags: JSON_THROW_ON_ERROR);

    expect(TeamOverrides::problems(Manifest::load(), base_path('smials'), $ledger))->toBe([]);
});
