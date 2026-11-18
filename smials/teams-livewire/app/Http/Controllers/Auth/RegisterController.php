<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\CreateUser;
use App\Actions\CreateUserEmailVerificationNotification;
use App\Actions\FindTeamInvitationContext;
use App\Actions\LoginUser;
use App\Http\Requests\CreateUserRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final readonly class RegisterController
{
    public function index(Request $request, FindTeamInvitationContext $findTeamInvitationContext): View
    {
        $code = $request->query('invitation');

        return view('pages.auth.register', [
            'teamInvitation' => $findTeamInvitationContext->handle(is_string($code) ? $code : null),
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
