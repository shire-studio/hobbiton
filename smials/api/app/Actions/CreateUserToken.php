<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\User;

final readonly class CreateUserToken
{
    public function handle(User $user, string $deviceName): string
    {
        return $user->createToken($deviceName)->plainTextToken;
    }
}
