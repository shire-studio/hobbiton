<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

final readonly class EmailVerificationController
{
    public function update(EmailVerificationRequest $request, #[CurrentUser] User $user): UserResource
    {
        $request->fulfill();

        return new UserResource($user);
    }
}
