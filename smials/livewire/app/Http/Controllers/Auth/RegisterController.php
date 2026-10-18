<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\CreateUser;
use App\Actions\CreateUserEmailVerificationNotification;
use App\Actions\LoginUser;
use App\Http\Requests\CreateUserRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;

final readonly class RegisterController
{
    public function index(): View
    {
        return view('pages.auth.register');
    }

    public function store(CreateUserRequest $request, CreateUser $action, CreateUserEmailVerificationNotification $createUserEmailVerificationNotification, LoginUser $loginUser): RedirectResponse
    {
        /** @var array<string, mixed> $attributes */
        $attributes = $request->safe()->except(['password', 'password_confirmation']);

        $user = $action->handle(
            $attributes,
            $request->string('password')->value(),
        );

        $createUserEmailVerificationNotification->handle($user);

        $loginUser->handle($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
