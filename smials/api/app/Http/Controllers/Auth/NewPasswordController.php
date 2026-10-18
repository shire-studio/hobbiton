<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\ResetUserPassword;
use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

final readonly class NewPasswordController
{
    public function store(ResetPasswordRequest $request, ResetUserPassword $action): JsonResponse
    {
        $status = $action->handle($request->validated());

        throw_if($status !== Password::PASSWORD_RESET, ValidationException::withMessages([
            'email' => [__($status)],
        ]));

        return response()->json([
            'status' => __('passwords.reset'),
        ]);
    }
}
