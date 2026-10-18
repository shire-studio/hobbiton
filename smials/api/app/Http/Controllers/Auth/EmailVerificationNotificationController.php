<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\CreateUserEmailVerificationNotification;
use App\Enums\SessionStatus;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

final readonly class EmailVerificationNotificationController
{
    public function __invoke(#[CurrentUser] User $user, CreateUserEmailVerificationNotification $action): JsonResponse
    {
        if ($user->hasVerifiedEmail()) {
            return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
        }

        $action->handle($user);

        return response()->json([
            'status' => SessionStatus::VerificationLinkSent->value,
        ], JsonResponse::HTTP_ACCEPTED);
    }
}
