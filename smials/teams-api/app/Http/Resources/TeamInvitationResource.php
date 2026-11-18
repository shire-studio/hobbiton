<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\TeamInvitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TeamInvitation
 */
final class TeamInvitationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'email' => $this->email,
            'role' => $this->role->value,
            'team' => new TeamResource($this->team)->withoutMembership(),
            'inviter_name' => $this->inviter->name,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
