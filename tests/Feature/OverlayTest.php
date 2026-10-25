<?php

use App\Support\Overlay;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->root = storage_path('framework/testing/overlay-'.uniqid());
    $this->base = "{$this->root}/base";
    $this->variant = "{$this->root}/variant";

    File::ensureDirectoryExists($this->base);
    File::ensureDirectoryExists($this->variant);
});

afterEach(function () {
    File::deleteDirectory($this->root);
});

function put(string $root, string $path, string $contents = 'x', bool $executable = false): void
{
    File::ensureDirectoryExists(dirname("{$root}/{$path}"));
    File::put("{$root}/{$path}", $contents);

    if ($executable) {
        chmod("{$root}/{$path}", 0755);
    }
}

it('lists added and changed files', function () {
    put($this->base, 'same.txt');
    put($this->variant, 'same.txt');
    put($this->base, 'changed.txt', 'old');
    put($this->variant, 'changed.txt', 'new');
    put($this->variant, 'app/added.txt');

    expect(Overlay::diff($this->base, $this->variant))->toBe([
        'files' => ['app/added.txt', 'changed.txt'],
        'deleted' => [],
    ]);
});

it('lists files the variant deletes', function () {
    put($this->base, 'gone.txt');
    put($this->base, 'kept.txt');
    put($this->variant, 'kept.txt');

    expect(Overlay::diff($this->base, $this->variant))->toBe([
        'files' => [],
        'deleted' => ['gone.txt'],
    ]);
});

it('ignores kept paths', function () {
    foreach (['.git/config', 'vendor/x', 'node_modules/x', '.env', 'database/database.sqlite', '.starter-kit/old'] as $path) {
        put($this->variant, $path);
        put($this->base, $path, 'base');
    }

    expect(Overlay::diff($this->base, $this->variant))->toBe(['files' => [], 'deleted' => []]);
});

it('keeps the executable bit', function () {
    put($this->variant, 'bin/run', '#!/bin/sh', executable: true);
    put($this->variant, 'plain.txt');

    Overlay::write($this->base, $this->variant);

    expect(is_executable("{$this->base}/.starter-kit/teams/files/bin/run"))->toBeTrue()
        ->and(is_executable("{$this->base}/.starter-kit/teams/files/plain.txt"))->toBeFalse();
});

it('lists files whose only difference is the executable bit', function () {
    put($this->base, 'bin/run', 'same');
    put($this->variant, 'bin/run', 'same', executable: true);

    expect(Overlay::diff($this->base, $this->variant)['files'])->toBe(['bin/run']);
});

it('writes nothing when the trees match', function () {
    put($this->base, 'a.txt');
    put($this->variant, 'a.txt');

    Overlay::write($this->base, $this->variant);

    expect("{$this->base}/.starter-kit")->not->toBeDirectory();
});

it('writes the manifest', function () {
    put($this->base, 'gone.txt');
    put($this->variant, 'new.txt');

    Overlay::write($this->base, $this->variant);

    $contents = File::get("{$this->base}/.starter-kit/teams/manifest.json");

    expect(json_decode($contents, true))->toBe(['version' => 1, 'deleted' => ['gone.txt']])
        ->and($contents)->toEndWith("}\n")
        ->and("{$this->base}/.starter-kit/teams/files/new.txt")->toBeFile();
});
