<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\CreateUserToken;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

final readonly class LoginController
{
    public function store(LoginRequest $request, CreateUserToken $createUserToken): JsonResponse
    {
        $user = $request->validateCredentials();

        return response()->json([
            'token' => $createUserToken->handle($user, $request->userAgent() ?? 'api'),
            'user' => new UserResource($user),
        ]);
    }
}
