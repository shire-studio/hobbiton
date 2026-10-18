<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\CreateUser;
use App\Actions\CreateUserEmailVerificationNotification;
use App\Actions\CreateUserToken;
use App\Http\Requests\CreateUserRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

final readonly class RegisterController
{
    public function store(CreateUserRequest $request, CreateUser $action, CreateUserEmailVerificationNotification $createUserEmailVerificationNotification, CreateUserToken $createUserToken): JsonResponse
    {
        /** @var array<string, mixed> $attributes */
        $attributes = $request->safe()->except(['password', 'password_confirmation']);

        $user = $action->handle(
            $attributes,
            $request->string('password')->value(),
        );

        $createUserEmailVerificationNotification->handle($user);

        return response()->json([
            'token' => $createUserToken->handle($user, $request->userAgent() ?? 'api'),
            'user' => new UserResource($user),
        ], JsonResponse::HTTP_CREATED);
    }
}
