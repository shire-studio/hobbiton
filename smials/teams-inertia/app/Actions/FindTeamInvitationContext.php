<?php

declare(strict_types=1);

namespace App\Actions;

use App\Data\TeamInvitationContextData;
use App\Models\TeamInvitation;
use Illuminate\Http\Request;

final readonly class FindTeamInvitationContext
{
    public function handle(Request $request): ?TeamInvitationContextData
    {
        $code = $request->query->all()['invitation'] ?? null;

        if (! is_string($code)) {
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
