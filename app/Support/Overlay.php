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
        $exportIgnored = self::exportIgnored($basePath);
        $base = self::tree($basePath, $exportIgnored);
        $variant = self::tree($variantPath, $exportIgnored);

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
     * Maps each relative path to a fingerprint of its bytes and executable bit. Paths the base kit's archive leaves
     * out are skipped, because a project created from the kit never has them.
     *
     * @param  list<string>  $exportIgnored
     * @return array<string, string>
     */
    private static function tree(string $path, array $exportIgnored): array
    {
        $tree = [];

        foreach (File::allFiles($path, hidden: true) as $file) {
            $relative = str_replace('\\', '/', $file->getRelativePathname());

            if (self::ignored($relative) || self::matchesAny($relative, $exportIgnored)) {
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

    /**
     * The patterns the kit's .gitattributes marks export-ignore.
     *
     * @return list<string>
     */
    private static function exportIgnored(string $basePath): array
    {
        if (! File::exists("{$basePath}/.gitattributes")) {
            return [];
        }

        $patterns = [];

        foreach (explode("\n", File::get("{$basePath}/.gitattributes")) as $line) {
            $fields = preg_split('/\s+/', trim($line), flags: PREG_SPLIT_NO_EMPTY) ?: [];

            if ($fields !== [] && ! str_starts_with($fields[0], '#') && in_array('export-ignore', array_slice($fields, 1), true)) {
                $patterns[] = $fields[0];
            }
        }

        return $patterns;
    }

    /**
     * Matches a path, or any directory above it, the way git matches an attributes pattern: a pattern with a slash
     * is relative to the root, and one without matches a name at any depth.
     *
     * @param  list<string>  $patterns
     */
    private static function matchesAny(string $relativePath, array $patterns): bool
    {
        $segments = explode('/', $relativePath);

        foreach ($patterns as $pattern) {
            $anchored = str_contains(rtrim($pattern, '/'), '/');
            $pattern = trim($pattern, '/');

            foreach (array_keys($segments) as $index) {
                $candidate = $anchored ? implode('/', array_slice($segments, 0, $index + 1)) : $segments[$index];

                if (fnmatch($pattern, $candidate, FNM_PATHNAME)) {
                    return true;
                }
            }
        }

        return false;
    }
}
