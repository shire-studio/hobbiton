<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\DeleteUserToken;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;

final readonly class LogoutController
{
    public function __invoke(#[CurrentUser] User $user, DeleteUserToken $deleteUserToken): Response
    {
        $deleteUserToken->handle($user);

        return response()->noContent();
    }
}
