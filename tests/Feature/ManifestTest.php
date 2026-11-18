<?php

use App\Support\Manifest;
use Illuminate\Support\Facades\File;
use Symfony\Component\Finder\SplFileInfo;

beforeEach(function () {
    $this->root = storage_path('framework/testing/manifest-'.uniqid());

    File::ensureDirectoryExists($this->root);
});

afterEach(function () {
    File::deleteDirectory($this->root);
});

function manifestFixture(string $root, array $kits): Manifest
{
    File::put("{$root}/hobbiton.json", json_encode(['kits' => $kits, 'replacementPaths' => ['composer.json']]));

    return Manifest::load("{$root}/hobbiton.json");
}

it('pairs every team kit with a base kit', function () {
    $manifest = Manifest::load();

    $teamKits = array_filter($manifest->kits, fn (array $kit): bool => isset($kit['base']));

    expect($teamKits)->not->toBeEmpty();

    foreach ($teamKits as $name => $kit) {
        expect($manifest->kits)->toHaveKey($kit['base'])
            ->and($manifest->kit($kit['base']))->not->toHaveKey('base')
            ->and($manifest->teamKitFor($kit['base']))->toBe($name);
    }
});

it('returns no team kit for a base kit without one', function () {
    expect(Manifest::load()->teamKitFor('blade'))->toBeNull();
});

it('raises team kits from their base smials followed by team smials', function () {
    $manifest = Manifest::load();

    foreach ($manifest->kits as $team) {
        if (! isset($team['base'])) {
            continue;
        }

        $base = $manifest->kit($team['base']);

        expect(array_slice($team['smials'], 0, count($base['smials'])))->toBe($base['smials']);

        foreach (array_slice($team['smials'], count($base['smials'])) as $smial) {
            expect($smial)->toStartWith('teams');
        }
    }
});

it("gives a team kit its base kit's repository, node and replacements, and adds its exclude to the base kit's", function () {
    $manifest = manifestFixture($this->root, [
        'api' => ['label' => 'API', 'repository' => 'x/api', 'node' => false, 'smials' => ['api'], 'exclude' => ['routes/web.php'], 'replacements' => ['{{kit}}' => 'api']],
        'api-teams' => ['label' => 'API Teams', 'base' => 'api', 'smials' => ['api', 'teams'], 'exclude' => ['config/teams.php']],
        'blade' => ['label' => 'Blade', 'repository' => 'x/blade', 'node' => true, 'smials' => ['blade'], 'replacements' => ['{{kit}}' => 'blade']],
        'blade-teams' => ['label' => 'Blade Teams', 'base' => 'blade', 'smials' => ['blade', 'teams']],
    ]);

    expect($manifest->kit('api-teams'))->toBe([
        'label' => 'API Teams',
        'base' => 'api',
        'smials' => ['api', 'teams'],
        'exclude' => ['routes/web.php', 'config/teams.php'],
        'repository' => 'x/api',
        'node' => false,
        'replacements' => ['{{kit}}' => 'api'],
    ])
        ->and($manifest->kit('blade-teams')['exclude'])->toBe([])
        ->and($manifest->kit('blade-teams')['node'])->toBeTrue()
        ->and($manifest->kit('api'))->not->toHaveKey('base')
        ->and($manifest->replacementPaths)->toBe(['composer.json']);
});

it('rejects a team kit with an unknown base', function () {
    manifestFixture($this->root, ['x-teams' => ['label' => 'X Teams', 'base' => 'x', 'smials' => []]]);
})->throws(InvalidArgumentException::class, 'Kit [x-teams] has an unknown base [x].');

it('leaves repository, node and replacements of team kits to their base kit', function () {
    $kits = json_decode(File::get(base_path('hobbiton.json')), true, flags: JSON_THROW_ON_ERROR)['kits'];

    foreach ($kits as $name => $kit) {
        if (isset($kit['base'])) {
            expect(array_intersect_key($kit, array_flip(['repository', 'node', 'replacements'])))->toBe([], "{$name} sets keys it takes from {$kit['base']}");
        }
    }
});

it("keeps lock files and vet.json out of team smials, because team kits share their base kit's", function () {
    $teamSmials = array_filter(
        array_map('basename', File::directories(base_path('smials'))),
        fn (string $smial): bool => $smial === 'teams' || str_starts_with($smial, 'teams-'),
    );

    expect($teamSmials)->not->toBeEmpty();

    foreach ($teamSmials as $smial) {
        $found = array_filter(
            File::allFiles(base_path("smials/{$smial}"), hidden: true),
            fn (SplFileInfo $file): bool => in_array($file->getFilename(), ['composer.lock', 'pnpm-lock.yaml', 'vet.json'], true),
        );

        expect(array_map(fn (SplFileInfo $file): string => $file->getRelativePathname(), $found))->toBe([], "smials/{$smial} holds a lock file or vet.json");
    }
});
