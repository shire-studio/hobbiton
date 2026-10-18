<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\LoginUser;
use App\Http\Requests\LoginRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

final readonly class LoginController
{
    public function index(Request $request): View
    {
        $status = $request->session()->get('status');

        return view('pages.auth.login', [
            'canResetPassword' => Route::has('password.request'),
            'canRegister' => true,
            'status' => is_string($status) ? $status : null,
        ]);
    }

    public function store(LoginRequest $request, LoginUser $loginUser): RedirectResponse
    {
        $user = $request->validateCredentials();

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            return to_route('two-factor.login');
        }

        $loginUser->handle($user, $request->boolean('remember'));

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
