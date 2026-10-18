<?php

namespace App\Console\Commands;

use App\Support\Manifest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use InvalidArgumentException;

use function Laravel\Prompts\error;
use function Laravel\Prompts\info;
use function Laravel\Prompts\select;

class RaiseCommand extends Command
{
    /**
     * Files a raised kit keeps between raises, so installs and local state survive.
     */
    private const array KEEP = ['.git', '.env', 'vendor', 'node_modules', 'database/database.sqlite'];

    /**
     * @var string
     */
    protected $signature = 'raise
                            {--kit= : The kit to raise (vue, react, svelte, livewire, api or blade)}
                            {--to= : Raise into this directory instead of raised/<kit>}';

    /**
     * @var string
     */
    protected $description = 'Raise a starter kit by stacking its smials';

    public function handle(): int
    {
        $manifest = Manifest::load();

        $name = $this->option('kit') ?: select(
            label: 'Which kit would you like to raise?',
            options: collect($manifest->kits)->map(fn (array $kit): string => $kit['label'])->all(),
        );

        try {
            $kit = $manifest->kit($name);
        } catch (InvalidArgumentException $exception) {
            error($exception->getMessage());

            return self::FAILURE;
        }

        $name = strtolower($name);
        $path = $this->option('to') ?: base_path("raised/{$name}");

        $this->clear($path);

        foreach ($kit['smials'] as $smial) {
            info("Copying {$smial}...");
            $this->copySmial(base_path("smials/{$smial}"), $path);
        }

        foreach ($kit['exclude'] ?? [] as $file) {
            File::delete("{$path}/{$file}");
            $this->deleteEmptyParents(dirname("{$path}/{$file}"), $path);
        }

        $this->applyReplacements($path, $manifest->replacementPaths, $kit['replacements']);

        // tend asks git which files the kit ignores, so every raised kit is its own repository.
        if (! File::isDirectory("{$path}/.git")) {
            Process::path($path)->run(['git', 'init', '-q']);
        }

        info("{$kit['label']} raised in {$path}.");

        return self::SUCCESS;
    }

    private function clear(string $path): void
    {
        File::ensureDirectoryExists($path);

        foreach (File::allFiles($path, hidden: true) as $file) {
            if (! $this->kept($file->getRelativePathname())) {
                File::delete($file->getPathname());
            }
        }

        foreach (array_reverse(File::directories($path)) as $directory) {
            if (! $this->kept(basename($directory))) {
                $this->deleteEmptyDirectories($directory);
            }
        }
    }

    private function kept(string $relativePath): bool
    {
        foreach (self::KEEP as $keep) {
            if ($relativePath === $keep || str_starts_with($relativePath, $keep.'/')) {
                return true;
            }
        }

        return false;
    }

    private function deleteEmptyDirectories(string $directory): void
    {
        foreach (File::directories($directory) as $child) {
            $this->deleteEmptyDirectories($child);
        }

        if (File::isEmptyDirectory($directory)) {
            File::deleteDirectory($directory);
        }
    }

    private function copySmial(string $source, string $destination): void
    {
        if (! File::isDirectory($source)) {
            return;
        }

        foreach (File::allFiles($source, hidden: true) as $file) {
            $target = $destination.'/'.$file->getRelativePathname();

            File::ensureDirectoryExists(dirname($target));
            File::copy($file->getPathname(), $target);

            if (is_executable($file->getPathname())) {
                chmod($target, 0755);
            }
        }
    }

    private function deleteEmptyParents(string $directory, string $root): void
    {
        while ($directory !== $root && File::isDirectory($directory) && File::isEmptyDirectory($directory)) {
            File::deleteDirectory($directory);
            $directory = dirname($directory);
        }
    }

    /**
     * @param  list<string>  $files
     * @param  array<string, string>  $replacements
     */
    private function applyReplacements(string $path, array $files, array $replacements): void
    {
        foreach ($files as $file) {
            if (File::exists("{$path}/{$file}")) {
                File::put("{$path}/{$file}", strtr(File::get("{$path}/{$file}"), $replacements));
            }
        }
    }
}
