<?php

namespace App\Support;

use App\Console\Commands\RaiseCommand;
use Illuminate\Support\Facades\File;

class Overlay
{
    public const string PATH = '.starter-kit/teams';

    /**
     * @return array{files: list<string>, deleted: list<string>}
     */
    public static function diff(string $basePath, string $variantPath): array
    {
        $base = self::tree($basePath);
        $variant = self::tree($variantPath);

        $files = array_values(array_filter(
            array_keys($variant),
            fn (string $path): bool => ! isset($base[$path]) || $base[$path] !== $variant[$path],
        ));

        $deleted = array_values(array_diff(array_keys($base), array_keys($variant)));

        sort($files);
        sort($deleted);

        return ['files' => $files, 'deleted' => $deleted];
    }

    public static function write(string $basePath, string $variantPath): void
    {
        $diff = self::diff($basePath, $variantPath);

        if ($diff['files'] === [] && $diff['deleted'] === []) {
            return;
        }

        $overlay = "{$basePath}/".self::PATH;

        File::deleteDirectory($overlay);

        foreach ($diff['files'] as $path) {
            File::ensureDirectoryExists(dirname("{$overlay}/files/{$path}"));
            File::copy("{$variantPath}/{$path}", "{$overlay}/files/{$path}");
            chmod("{$overlay}/files/{$path}", is_executable("{$variantPath}/{$path}") ? 0755 : 0644);
        }

        File::ensureDirectoryExists($overlay);
        File::put(
            "{$overlay}/manifest.json",
            json_encode(['version' => 1, 'deleted' => $diff['deleted']], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n",
        );
    }

    /**
     * Maps each relative path to a fingerprint of its bytes and executable bit.
     *
     * @return array<string, string>
     */
    private static function tree(string $path): array
    {
        $tree = [];

        foreach (File::allFiles($path, hidden: true) as $file) {
            $relative = $file->getRelativePathname();

            if (self::ignored($relative)) {
                continue;
            }

            $tree[$relative] = md5_file($file->getPathname()).(is_executable($file->getPathname()) ? ':x' : '');
        }

        return $tree;
    }

    private static function ignored(string $relativePath): bool
    {
        foreach ([...RaiseCommand::KEEP, '.starter-kit'] as $ignored) {
            if ($relativePath === $ignored || str_starts_with($relativePath, $ignored.'/')) {
                return true;
            }
        }

        return false;
    }
}
