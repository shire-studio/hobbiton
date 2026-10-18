<?php

use App\Support\Manifest;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->path = storage_path('framework/testing/raised-'.uniqid());
});

afterEach(function () {
    File::deleteDirectory($this->path);
});

function raise(string $kit, string $path): void
{
    test()->artisan('raise', ['--kit' => $kit, '--to' => $path])->assertSuccessful();
}

it('raises every kit in the manifest', function (string $kit) {
    raise($kit, $this->path);

    $composer = json_decode(File::get("{$this->path}/composer.json"), true);

    expect($composer['name'])->toBe(Manifest::load()->kit($kit)['repository'])
        ->and(File::get("{$this->path}/composer.json"))->not->toContain('{{')
        ->and(is_executable("{$this->path}/artisan"))->toBeTrue()
        ->and("{$this->path}/.git")->toBeDirectory();
})->with(array_keys(json_decode(file_get_contents(__DIR__.'/../../hobbiton.json'), true)['kits']));

it('lets later smials override earlier ones', function () {
    raise('react', $this->path);

    expect(File::get("{$this->path}/resources/views/app.blade.php"))->toContain('app.tsx')
        ->and("{$this->path}/resources/js/pages/auth/Login.tsx")->toBeFile()
        ->and("{$this->path}/resources/js/pages/auth/Login.vue")->not->toBeFile();
});

it('shares the php application between the inertia kits', function () {
    $paths = ['app', 'routes', 'tests/Feature'];

    $raised = collect(['vue', 'react', 'svelte'])->mapWithKeys(function (string $kit) use ($paths) {
        $path = "{$this->path}/{$kit}";
        raise($kit, $path);

        return [$kit => collect($paths)->flatMap(fn (string $directory) => collect(File::allFiles("{$path}/{$directory}"))
            ->mapWithKeys(fn ($file) => [$directory.'/'.$file->getRelativePathname() => md5($file->getContents())]))
            ->sortKeys()
            ->all()];
    });

    expect($raised['react'])->toBe($raised['vue'])
        ->and($raised['svelte'])->toBe($raised['vue']);
});

it('removes excluded files and the directories they leave empty', function () {
    raise('api', $this->path);

    expect("{$this->path}/app/Models/Passkey.php")->not->toBeFile()
        ->and("{$this->path}/config/fortify.php")->not->toBeFile()
        ->and("{$this->path}/tests/Browser")->not->toBeDirectory()
        ->and("{$this->path}/app/Actions/CreateUser.php")->toBeFile();
});

it('keeps installs and local state when raising again', function () {
    raise('blade', $this->path);

    File::ensureDirectoryExists("{$this->path}/vendor/acme");
    File::put("{$this->path}/vendor/acme/kept.php", '<?php');
    File::put("{$this->path}/.env", 'APP_NAME=Kept');
    File::put("{$this->path}/stale.txt", 'gone');

    raise('blade', $this->path);

    expect("{$this->path}/vendor/acme/kept.php")->toBeFile()
        ->and(File::get("{$this->path}/.env"))->toBe('APP_NAME=Kept')
        ->and("{$this->path}/stale.txt")->not->toBeFile();
});

it('rejects unknown kits', function () {
    $this->artisan('raise', ['--kit' => 'angular', '--to' => $this->path])->assertFailed();
});
