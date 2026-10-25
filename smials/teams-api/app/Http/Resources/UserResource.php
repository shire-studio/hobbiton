<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
final class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->resource;

        assert($user instanceof User);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'current_team' => ($team = $this->currentTeamOrPersonal()) instanceof Team ? new TeamResource($team)->viewedBy($user) : null,
        ];
    }
}
