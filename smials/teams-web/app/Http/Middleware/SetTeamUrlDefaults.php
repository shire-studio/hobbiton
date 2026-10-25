<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Team;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

final readonly class SetTeamUrlDefaults
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && ($team = $user->currentTeamOrPersonal()) instanceof Team) {
            URL::defaults(['current_team' => $team->slug, 'team' => $team->slug]);
        }

        return $next($request);
    }
}
