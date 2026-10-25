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

        return new self($manifest['kits'], $manifest['replacementPaths']);
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

    /**
     * @return list<string>
     */
    public function baseKits(): array
    {
        return array_keys(array_filter($this->kits, fn (array $kit): bool => ! isset($kit['base'])));
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
