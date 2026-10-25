<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Actions\SwitchTeam;
use App\Http\Requests\UpdateCurrentTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

final readonly class CurrentTeamController
{
    public function __invoke(UpdateCurrentTeamRequest $request, #[CurrentUser] User $user, SwitchTeam $switchTeam): TeamResource
    {
        $team = Team::query()->findOrFail($request->string('team_id')->value());

        $switchTeam->handle($user, $team);

        return new TeamResource($team);
    }
}
