<?php

declare(strict_types=1);

use App\Http\Middleware\SetTeamUrlDefaults;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

beforeEach(function (): void {
    Route::middleware(['web', SetTeamUrlDefaults::class])->get('{current_team}/defaults', fn (): string => 'ok')->name('defaults.current');
    Route::middleware(['web', SetTeamUrlDefaults::class])->get('defaults/{team}', fn (): string => 'ok')->name('defaults.team');
    Route::getRoutes()->refreshNameLookups();
    Route::middleware(['web', SetTeamUrlDefaults::class])->get('open', fn (): string => 'ok');
});

it('sets url defaults to the current team', function (): void {
    $user = User::factory()->create();
    $team = $user->currentTeamOrPersonal();

    $this->actingAs($user)->get('open')->assertOk();

    expect(route('defaults.current'))->toEndWith("/{$team->slug}/defaults")
        ->and(route('defaults.team'))->toEndWith("/defaults/{$team->slug}");
});

it('sets no defaults for guests', function (): void {
    URL::defaults(['current_team' => null, 'team' => null]);

    $this->get('open')->assertOk();

    expect(URL::getDefaultParameters())->toBe(['current_team' => null, 'team' => null]);
});

it('sets no defaults for users without a team', function (): void {
    URL::defaults(['current_team' => null, 'team' => null]);
    $user = User::factory()->create();
    $user->teams()->detach();
    $user->forceFill(['current_team_id' => null])->save();

    $this->actingAs($user)->get('open')->assertOk();

    expect(URL::getDefaultParameters())->toBe(['current_team' => null, 'team' => null]);
});
