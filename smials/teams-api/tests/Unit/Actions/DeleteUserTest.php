<?php

declare(strict_types=1);

use App\Actions\DeleteUser;
use App\Models\Team;
use App\Models\User;

it('may delete a user', function (): void {
    $user = User::factory()->create();

    resolve(DeleteUser::class)->handle($user);

    expect($user->fresh())->toBeNull();
});

it('deletes the users tokens along with the user', function (): void {
    $user = User::factory()->create();
    $user->createToken('api');

    resolve(DeleteUser::class)->handle($user);

    expect($user->tokens()->count())->toBe(0);
});

it('deletes the users teams', function (): void {
    $user = User::factory()->create();
    $personal = $user->personalTeam();

    resolve(DeleteUser::class)->handle($user);

    expect($user->fresh())->toBeNull()
        ->and(Team::query()->find($personal?->id))->toBeNull();
});
