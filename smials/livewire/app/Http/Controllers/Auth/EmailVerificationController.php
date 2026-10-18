<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\View\View;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final readonly class EmailVerificationController
{
    public function index(Request $request, #[CurrentUser] User $user): View|RedirectResponse
    {
        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $status = $request->session()->get('status');

        return view('pages.auth.verify-email', [
            'status' => is_string($status) ? $status : null,
        ]);
    }

    public function update(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
