<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Livewire\Settings\ManageTwoFactor;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Livewire\Livewire;

it('keeps the current team on livewire update requests', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    $user->forceFill(['current_team_id' => $team->id])->save();

    URL::defaults(['current_team' => null, 'team' => null]);

    $component = Livewire::actingAs($user)->test(ManageTwoFactor::class);

    $this->actingAs($user)
        ->postJson(route('default-livewire.update'), [
            'components' => [[
                'snapshot' => json_encode($component->snapshot),
                'updates' => [],
                'calls' => [],
            ]],
        ], ['X-Livewire' => 'true'])
        ->assertOk();

    expect($user->refresh()->current_team_id)->toBe($team->id)
        ->and(URL::getDefaultParameters())->toMatchArray(['current_team' => $team->slug, 'team' => $team->slug]);
});
