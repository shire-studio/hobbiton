<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\SendPasswordResetLink;
use App\Http\Requests\SendPasswordResetLinkRequest;
use Illuminate\Http\JsonResponse;

final readonly class PasswordResetLinkController
{
    public function store(
        SendPasswordResetLinkRequest $request,
        SendPasswordResetLink $action
    ): JsonResponse {
        $action->handle(['email' => $request->string('email')->lower()->value()]);

        return response()->json([
            'status' => __('A reset link will be sent if the account exists.'),
        ]);
    }
}
