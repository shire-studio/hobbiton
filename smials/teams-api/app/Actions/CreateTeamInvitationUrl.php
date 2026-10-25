<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\TeamInvitation;

final readonly class CreateTeamInvitationUrl
{
    public function handle(TeamInvitation $invitation): string
    {
        return config()->string('app.frontend_url').'/invitations/'.$invitation->code;
    }
}
