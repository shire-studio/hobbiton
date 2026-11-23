<?php

declare(strict_types=1);

use App\Actions\CreateTeamInvitationUrl;
use App\Models\TeamInvitation;

it('links to the frontend invitation page', function (): void {
    $invitation = TeamInvitation::factory()->create();

    expect(resolve(CreateTeamInvitationUrl::class)->handle($invitation))
        ->toBe(config('app.frontend_url').'/invitations/'.$invitation->code);
});
