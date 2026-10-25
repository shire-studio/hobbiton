<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Actions\SwitchTeam;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

final readonly class EnsureTeamMembership
{
    public function __construct(private SwitchTeam $switchTeam) {}

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $minimumRole = null): Response
    {
        $user = $request->user();
        $team = $request->route('current_team') ?? $request->route('team');

        abort_unless($user instanceof User && $team instanceof Team && $user->belongsToTeam($team), 404);

        if ($minimumRole !== null) {
            $role = $user->teamRole($team);

            abort_unless($role instanceof TeamRole && $role->isAtLeast(TeamRole::from($minimumRole)), 404);
        }

        if ($request->route('current_team') instanceof Team && ! $user->isCurrentTeam($team)) {
            $this->switchTeam->handle($user, $team);
            URL::defaults(['current_team' => $team->slug, 'team' => $team->slug]);
        }

        return $next($request);
    }
}
