<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Actions\UpdateUserPassword;
use App\Http\Requests\TwoFactorAuthenticationRequest;
use App\Http\Requests\UpdateUserPasswordRequest;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Laravel\Fortify\Features;

final readonly class SecurityController implements HasMiddleware
{
    public static function middleware(): array
    {
        return Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')
            ? [new Middleware('password.confirm', only: ['edit'])]
            : [];
    }

    public function edit(TwoFactorAuthenticationRequest $request, #[CurrentUser] User $user): View
    {
        $request->ensureStateIsValid();

        return view('pages.settings.security', [
            'canManageTwoFactor' => Features::enabled(Features::twoFactorAuthentication()),
            'requiresConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
            'twoFactorEnabled' => $user->hasEnabledTwoFactorAuthentication(),
            'canManagePasskeys' => Features::canManagePasskeys(),
        ]);
    }

    public function update(UpdateUserPasswordRequest $request, #[CurrentUser] User $user, UpdateUserPassword $action): RedirectResponse
    {
        $action->handle($user, $request->string('password')->value());

        return back()->with('toast', ['type' => 'success', 'message' => __('Password updated.')]);
    }
}
