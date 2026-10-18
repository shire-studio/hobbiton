<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Actions\UpdateUserPassword;
use App\Http\Requests\UpdateUserPasswordRequest;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;

final readonly class SecurityController
{
    public function update(UpdateUserPasswordRequest $request, #[CurrentUser] User $user, UpdateUserPassword $action): Response
    {
        $action->handle($user, $request->string('password')->value());

        return response()->noContent();
    }
}
