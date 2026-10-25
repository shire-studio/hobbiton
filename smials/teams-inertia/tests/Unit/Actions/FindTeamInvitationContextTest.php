<?php

declare(strict_types=1);

use App\Actions\FindTeamInvitationContext;
use App\Models\TeamInvitation;
use Illuminate\Http\Request;

function invitationRequest(string|array|null $code): Request
{
    return Request::create('/', 'GET', $code === null ? [] : ['invitation' => $code]);
}

it('finds a pending invitation by code', function (): void {
    $invitation = TeamInvitation::factory()->create();

    expect(resolve(FindTeamInvitationContext::class)->handle(invitationRequest($invitation->code))?->team_name)
        ->toBe($invitation->team->name);
});

it('returns null for missing, array, empty, unknown, expired and accepted codes', function (): void {
    $expired = TeamInvitation::factory()->expired()->create();
    $accepted = TeamInvitation::factory()->accepted()->create();
    $action = resolve(FindTeamInvitationContext::class);

    expect($action->handle(invitationRequest(null)))->toBeNull()
        ->and($action->handle(invitationRequest(['x'])))->toBeNull()
        ->and($action->handle(invitationRequest('')))->toBeNull()
        ->and($action->handle(invitationRequest('unknown')))->toBeNull()
        ->and($action->handle(invitationRequest($expired->code)))->toBeNull()
        ->and($action->handle(invitationRequest($accepted->code)))->toBeNull();
});
