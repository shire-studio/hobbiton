<?php

use App\Support\Manifest;
use Illuminate\Support\Facades\File;
use Symfony\Component\Finder\SplFileInfo;

it('lists base kits', function () {
    expect(Manifest::load()->baseKits())->toBe(['vue', 'react', 'svelte', 'livewire', 'api', 'blade']);
});

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

it("gives team kits their base kit's repository, node, exclude and replacements", function () {
    $manifest = Manifest::load();

    foreach ($manifest->kits as $team) {
        if (! isset($team['base'])) {
            continue;
        }

        $base = $manifest->kit($team['base']);

        foreach (['repository', 'node', 'exclude', 'replacements'] as $key) {
            expect($team[$key] ?? null)->toBe($base[$key] ?? null);
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
