<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Auth\Access\Response;
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
        Gate::defaultDenialResponse(
            Response::denyAsNotFound()
        );
    }
}
