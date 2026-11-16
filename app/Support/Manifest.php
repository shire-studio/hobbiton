<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use InvalidArgumentException;

/**
 * Reads hobbiton.json, which lists every kit and the smials it is raised from.
 */
class Manifest
{
    /**
     * @param  array<string, array{label: string, base?: string, repository: string, node: bool, smials: list<string>, exclude?: list<string>, replacements: array<string, string>}>  $kits
     * @param  list<string>  $replacementPaths
     */
    public function __construct(
        public readonly array $kits,
        public readonly array $replacementPaths,
    ) {}

    public static function load(?string $path = null): self
    {
        $manifest = json_decode(File::get($path ?? base_path('hobbiton.json')), true, flags: JSON_THROW_ON_ERROR);

        return new self(self::inheritBases($manifest['kits']), $manifest['replacementPaths']);
    }

    /**
     * A team kit ships in its base kit's repository, so it takes the base kit's repository, node and replacements.
     * Its exclude list adds to the base kit's, which lets it drop a file the base kit raises.
     *
     * @param  array<string, array<string, mixed>>  $kits
     * @return array<string, array{label: string, base?: string, repository: string, node: bool, smials: list<string>, exclude?: list<string>, replacements: array<string, string>}>
     */
    private static function inheritBases(array $kits): array
    {
        foreach ($kits as $name => $kit) {
            if (! isset($kit['base'])) {
                continue;
            }

            $base = $kits[$kit['base']] ?? throw new InvalidArgumentException("Kit [{$name}] has an unknown base [{$kit['base']}].");

            $kits[$name] = [
                ...$kit,
                'repository' => $base['repository'],
                'node' => $base['node'],
                'exclude' => [...$base['exclude'] ?? [], ...$kit['exclude'] ?? []],
                'replacements' => $base['replacements'],
            ];
        }

        return $kits;
    }

    /**
     * @return list<string>
     */
    public function names(): array
    {
        return array_keys($this->kits);
    }

    /**
     * @return array{label: string, base?: string, repository: string, node: bool, smials: list<string>, exclude?: list<string>, replacements: array<string, string>}
     */
    public function kit(string $name): array
    {
        return $this->kits[strtolower($name)]
            ?? throw new InvalidArgumentException("Unknown kit [{$name}]. Available kits: ".implode(', ', $this->names()));
    }

    public function teamKitFor(string $name): ?string
    {
        foreach ($this->kits as $teamKit => $kit) {
            if (($kit['base'] ?? null) === $name) {
                return $teamKit;
            }
        }

        return null;
    }
}
