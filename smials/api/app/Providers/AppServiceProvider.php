<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (mixed $user, string $token): string {
            assert($user instanceof User);

            return config()->string('app.frontend_url').'/reset-password/'.$token.'?'.http_build_query(['email' => $user->email]);
        });

        Gate::defaultDenialResponse(
            Response::denyAsNotFound()
        );
    }
}
