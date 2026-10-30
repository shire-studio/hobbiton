<?php

namespace App\Support;

use Illuminate\Support\Facades\File;

/**
 * Checks team-overrides.json, the ledger of team smial files that override a base smial file.
 */
class TeamOverrides
{
    /**
     * @param  array<string, array{base: string, sha1: string}>  $ledger
     * @return list<string>
     */
    public static function problems(Manifest $manifest, string $smialsPath, array $ledger): array
    {
        $problems = [];

        foreach (self::expectedOwners($manifest, $smialsPath) as $key => $owners) {
            if (count($owners) > 1) {
                $problems[] = "{$key} has an ambiguous base: ".implode(', ', $owners).'. Give each base its own team file.';

                continue;
            }

            $base = $owners[0];
            $path = substr($key, strpos($key, '/') + 1);
            $entry = $ledger[$key] ?? null;

            if ($entry === null || $entry['base'] !== $base) {
                $problems[] = "{$key} overrides {$base}/{$path} but is not in team-overrides.json. Run composer tend to record it.";
            } elseif ($entry['sha1'] !== sha1_file("{$smialsPath}/{$base}/{$path}")) {
                $problems[] = "{$key} overrides {$base}/{$path}, which changed since it was overridden. Review the team file, then run composer overrides -- --accept.";
            }
        }

        foreach (array_keys($ledger) as $key) {
            $path = substr($key, strpos($key, '/') + 1);

            if (! File::exists("{$smialsPath}/{$key}")) {
                $problems[] = "team-overrides.json lists {$key}, which no longer exists. Run composer overrides -- --accept.";
            } elseif (! File::exists("{$smialsPath}/{$ledger[$key]['base']}/{$path}")) {
                $problems[] = "{$key} overrides {$ledger[$key]['base']}/{$path}, which no longer exists. Run composer overrides -- --accept.";
            }
        }

        return $problems;
    }

    /**
     * The base smials each effective team file shadows, keyed "<teamSmial>/<path>". A team file is effective in a
     * kit when its smial is the last in the kit's order to hold the path, and a file with no base copy is new.
     *
     * @return array<string, list<string>>
     */
    private static function expectedOwners(Manifest $manifest, string $smialsPath): array
    {
        $owners = [];

        foreach ($manifest->kits as $kit) {
            if (! isset($kit['base'])) {
                continue;
            }

            foreach ($kit['smials'] as $smial) {
                if (! self::isTeamSmial($smial)) {
                    continue;
                }

                foreach (self::files("{$smialsPath}/{$smial}") as $path) {
                    $holders = array_values(array_filter($kit['smials'], fn (string $candidate): bool => File::exists("{$smialsPath}/{$candidate}/{$path}")));

                    if (end($holders) !== $smial) {
                        continue;
                    }

                    $bases = array_values(array_filter($holders, fn (string $holder): bool => ! self::isTeamSmial($holder)));

                    if ($bases === []) {
                        continue;
                    }

                    $key = "{$smial}/{$path}";
                    $owners[$key] = array_values(array_unique([...$owners[$key] ?? [], end($bases)]));
                }
            }
        }

        return $owners;
    }

    /**
     * @return list<string>
     */
    private static function files(string $directory): array
    {
        if (! File::isDirectory($directory)) {
            return [];
        }

        return array_map(
            fn ($file): string => str_replace('\\', '/', $file->getRelativePathname()),
            File::allFiles($directory, true),
        );
    }

    private static function isTeamSmial(string $smial): bool
    {
        return $smial === 'teams' || str_starts_with($smial, 'teams-');
    }
}
