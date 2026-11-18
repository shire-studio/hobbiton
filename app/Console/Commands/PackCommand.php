<?php

namespace App\Console\Commands;

use App\Support\Manifest;
use App\Support\Overlay;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;

use function Laravel\Prompts\error;
use function Laravel\Prompts\info;

class PackCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'pack
                            {--kit= : The base kit to pack (vue, react, svelte, livewire, api or blade)}
                            {--to= : Pack into this directory}';

    /**
     * @var string
     */
    protected $description = 'Raise a starter kit together with its team overlay';

    public function handle(): int
    {
        $manifest = Manifest::load();
        $name = strtolower((string) $this->option('kit'));
        $path = $this->option('to');

        if (! $path) {
            error('Pass --to with the directory to pack into.');

            return self::FAILURE;
        }

        try {
            $kit = $manifest->kit($name);
        } catch (InvalidArgumentException $exception) {
            error($exception->getMessage());

            return self::FAILURE;
        }

        if (isset($kit['base'])) {
            error("Pack the base kit [{$kit['base']}] instead.");

            return self::FAILURE;
        }

        $status = $this->call('raise', ['--kit' => $name, '--to' => $path]);

        if ($status !== self::SUCCESS) {
            return $status;
        }

        $teamKit = $manifest->teamKitFor($name);

        if ($teamKit === null) {
            return self::SUCCESS;
        }

        $temporary = storage_path('framework/pack/'.uniqid());

        try {
            $status = $this->call('raise', ['--kit' => $teamKit, '--to' => $temporary]);

            if ($status !== self::SUCCESS) {
                return $status;
            }

            Overlay::write($path, $temporary);
        } finally {
            File::deleteDirectory($temporary);
        }

        info("{$kit['label']} packed in {$path} with its team overlay.");

        return self::SUCCESS;
    }
}
