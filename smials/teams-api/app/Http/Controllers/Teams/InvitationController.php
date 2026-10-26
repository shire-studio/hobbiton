<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Http\Resources\TeamInvitationResource;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final readonly class InvitationController
{
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        $invitations = TeamInvitation::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($user->email)])
            ->with(['team', 'inviter'])
            ->latest();

        $invitations->scopes(['pending', 'joinable']);

        return TeamInvitationResource::collection($invitations->get());
    }
}
