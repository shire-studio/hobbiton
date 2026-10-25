<?php

declare(strict_types=1);

use App\Actions\FindTeamInvitationContext;
use App\Models\TeamInvitation;

it('finds a pending invitation by code', function (): void {
    $invitation = TeamInvitation::factory()->create();

    expect(resolve(FindTeamInvitationContext::class)->handle($invitation->code)?->team_name)
        ->toBe($invitation->team->name);
});

it('returns null for non string, unknown and expired codes', function (): void {
    $expired = TeamInvitation::factory()->expired()->create();
    $action = resolve(FindTeamInvitationContext::class);

    expect($action->handle(null))->toBeNull()
        ->and($action->handle(['x']))->toBeNull()
        ->and($action->handle('unknown'))->toBeNull()
        ->and($action->handle($expired->code))->toBeNull();
});
