<?php

declare(strict_types=1);

namespace App\View\Components;

use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\View\Component;

final class TeamSwitcher extends Component
{
    /**
     * @var Collection<int, Team>
     */
    public Collection $teams;

    public ?Team $currentTeam;

    public function __construct(#[CurrentUser] User $user, public bool $inHeader = false)
    {
        $this->teams = $user->teams()->orderByRaw('LOWER(teams.name)')->get();
        $this->currentTeam = $user->currentTeamOrPersonal();
    }

    public function render(): View
    {
        return view('components.team-switcher');
    }
}
