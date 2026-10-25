<?php

declare(strict_types=1);

namespace App\Actions;

use App\Data\TeamInvitationContextData;
use App\Models\TeamInvitation;

final readonly class FindTeamInvitationContext
{
    public function handle(?string $code): ?TeamInvitationContextData
    {
        if ($code === null) {
            return null;
        }

        $invitations = TeamInvitation::query();
        $invitations->scopes('pending');

        $invitation = $invitations->where('code', $code)->with('team')->first();

        return $invitation instanceof TeamInvitation
            ? TeamInvitationContextData::fromInvitation($invitation)
            : null;
    }
}
