<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class DeleteUser
{
    public function __construct(private DeleteUserTeams $deleteUserTeams) {}

    public function handle(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->deleteUserTeams->handle($user);

            $user->tokens()->delete();

            $user->delete();
        });
    }
}
