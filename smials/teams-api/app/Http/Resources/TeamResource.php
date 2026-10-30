<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Team
 */
final class TeamResource extends JsonResource
{
    private bool $withMembership = true;

    private ?User $viewer = null;

    /**
     * @var array<string, bool>|null
     */
    private ?array $permissions = null;

    public function withoutMembership(): self
    {
        $this->withMembership = false;

        return $this;
    }

    public function viewedBy(User $viewer): self
    {
        $this->viewer = $viewer;

        return $this;
    }

    /**
     * @param  array<string, bool>  $permissions
     */
    public function withPermissions(array $permissions): self
    {
        $this->permissions = $permissions;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->viewer ?? $request->user();

        $team = $this->resource;

        assert($user instanceof User);
        assert($team instanceof Team);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'is_personal' => $this->is_personal,
            'role' => $this->when($this->withMembership, fn (): ?string => $user->teamRole($team)?->value),
            'is_current' => $this->when($this->withMembership, fn (): bool => $user->currentTeamOrPersonal()?->id === $this->id),
            'members' => $this->whenLoaded('members', fn () => TeamMemberResource::collection($this->members)),
            'invitations' => $this->whenLoaded('invitations', fn () => TeamInvitationResource::collection($this->invitations)),
            'permissions' => $this->when($this->permissions !== null, fn (): ?array => $this->permissions),
        ];
    }
}
