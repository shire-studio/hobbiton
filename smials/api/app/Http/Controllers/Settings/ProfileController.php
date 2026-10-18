<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Actions\DeleteUser;
use App\Actions\UpdateUser;
use App\Http\Requests\DeleteUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;

final readonly class ProfileController
{
    public function show(#[CurrentUser] User $user): UserResource
    {
        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, #[CurrentUser] User $user, UpdateUser $action): UserResource
    {
        $action->handle($user, $request->validated());

        return new UserResource($user);
    }

    public function destroy(DeleteUserRequest $request, #[CurrentUser] User $user, DeleteUser $deleteUser): Response
    {
        $deleteUser->handle($user);

        return response()->noContent();
    }
}
