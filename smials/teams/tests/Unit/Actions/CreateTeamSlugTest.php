<?php

declare(strict_types=1);

use App\Actions\CreateTeamSlug;
use App\Models\Team;

it('slugs the name', function (): void {
    expect(resolve(CreateTeamSlug::class)->handle('Acme Inc'))->toBe('acme-inc');
});

it('suffixes a taken slug', function (): void {
    Team::factory()->create(['slug' => 'acme']);
    Team::factory()->create(['slug' => 'acme-1']);
    Team::factory()->create(['slug' => 'acme-2']);
    Team::factory()->create(['slug' => 'acme-corp']);

    expect(resolve(CreateTeamSlug::class)->handle('Acme'))->toBe('acme-3');
});

it('suffixes a single taken slug', function (): void {
    Team::factory()->create(['slug' => 'acme']);

    expect(resolve(CreateTeamSlug::class)->handle('Acme'))->toBe('acme-1');
});

it('counts soft deleted teams', function (): void {
    Team::factory()->create(['slug' => 'acme'])->delete();

    expect(resolve(CreateTeamSlug::class)->handle('Acme'))->toBe('acme-1');
});

it('ignores the given team', function (): void {
    $team = Team::factory()->create(['slug' => 'acme']);

    expect(resolve(CreateTeamSlug::class)->handle('Acme', $team))->toBe('acme');
});
