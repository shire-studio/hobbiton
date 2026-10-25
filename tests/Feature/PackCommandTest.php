<?php

use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->root = storage_path('framework/testing/pack-'.uniqid());
});

afterEach(function () {
    File::deleteDirectory($this->root);
});

function tree(string $path, array $except = ['.git']): array
{
    return collect(File::allFiles($path, hidden: true))
        ->reject(fn ($file) => collect($except)->contains(fn ($skip) => str_starts_with($file->getRelativePathname(), $skip.'/')))
        ->mapWithKeys(fn ($file) => [$file->getRelativePathname() => md5_file($file->getPathname()).(is_executable($file->getPathname()) ? ' x' : '')])
        ->sortKeys()
        ->all();
}

it('packs the api kit with its team overlay', function () {
    $this->artisan('pack', ['--kit' => 'api', '--to' => "{$this->root}/packed"])->assertSuccessful();
    $this->artisan('raise', ['--kit' => 'api', '--to' => "{$this->root}/plain"])->assertSuccessful();

    expect("{$this->root}/packed/.starter-kit/teams/files/app/Models/Team.php")->toBeFile()
        ->and("{$this->root}/packed/.starter-kit/teams/manifest.json")->toBeFile()
        ->and(tree("{$this->root}/packed", ['.git', '.starter-kit']))->toBe(tree("{$this->root}/plain"))
        ->and(File::directories(storage_path('framework/pack')))->toBe([]);
});

it('applies the overlay to reproduce the team kit', function () {
    $packed = "{$this->root}/packed";

    $this->artisan('pack', ['--kit' => 'api', '--to' => $packed])->assertSuccessful();
    $this->artisan('raise', ['--kit' => 'api-teams', '--to' => "{$this->root}/teams"])->assertSuccessful();

    $overlay = "{$packed}/.starter-kit/teams";
    $manifest = json_decode(File::get("{$overlay}/manifest.json"), true);

    foreach (File::allFiles("{$overlay}/files", hidden: true) as $file) {
        $target = "{$packed}/{$file->getRelativePathname()}";

        File::ensureDirectoryExists(dirname($target));
        File::copy($file->getPathname(), $target);
        chmod($target, fileperms($file->getPathname()) & 0777);
    }

    foreach ($manifest['deleted'] as $path) {
        File::delete("{$packed}/{$path}");
    }

    File::deleteDirectory("{$packed}/.starter-kit");

    expect(tree($packed))->toBe(tree("{$this->root}/teams"));
});

it('packs kits without a team variant unchanged', function () {
    $this->artisan('pack', ['--kit' => 'blade', '--to' => "{$this->root}/packed"])->assertSuccessful();

    expect("{$this->root}/packed/.starter-kit")->not->toBeDirectory()
        ->and("{$this->root}/packed/composer.json")->toBeFile();
});

it('refuses to pack a team kit', function () {
    $this->artisan('pack', ['--kit' => 'api-teams', '--to' => "{$this->root}/packed"])
        ->expectsOutputToContain('Pack the base kit [api] instead.')
        ->assertFailed();
});

it('requires a destination and a known kit', function () {
    $this->artisan('pack', ['--kit' => 'api'])
        ->expectsOutputToContain('Pass --to')
        ->assertFailed();

    $this->artisan('pack', ['--kit' => 'nope', '--to' => "{$this->root}/packed"])->assertFailed();
});
