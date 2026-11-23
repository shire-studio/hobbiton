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
        $invitations = TeamInvitation::query();
        $invitations->scopes(['pendingFor' => [$user]]);

        return TeamInvitationResource::collection($invitations->get());
    }
}
