<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\CreateUser;
use App\Actions\CreateUserEmailVerificationNotification;
use App\Actions\FindTeamInvitationContext;
use App\Actions\LoginUser;
use App\Http\Requests\CreateUserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final readonly class RegisterController
{
    public function index(Request $request, FindTeamInvitationContext $findTeamInvitationContext): Response
    {
        return Inertia::render('auth/Register', [
            'teamInvitation' => $findTeamInvitationContext->handle($request),
        ]);
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
