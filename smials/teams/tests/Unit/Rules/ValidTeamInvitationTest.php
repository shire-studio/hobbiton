<?php

declare(strict_types=1);

use App\Models\TeamInvitation;
use App\Models\User;
use App\Rules\ValidTeamInvitation;
use Illuminate\Support\Facades\Validator;

function validInvitationValidator(User $user, mixed $invitation): Illuminate\Validation\Validator
{
    return Validator::make(['invitation' => $invitation], ['invitation' => [new ValidTeamInvitation($user)]]);
}

it("accepts a pending invitation for the user's email", function (): void {
    $user = User::factory()->create(['email' => 'frodo@shire.test']);
    $invitation = TeamInvitation::factory()->create(['email' => 'FRODO@shire.test']);

    expect(validInvitationValidator($user, $invitation)->passes())->toBeTrue();
});

it('rejects an invitation for another email', function (): void {
    $user = User::factory()->create(['email' => 'frodo@shire.test']);
    $invitation = TeamInvitation::factory()->create(['email' => 'sam@shire.test']);

    $validator = validInvitationValidator($user, $invitation);

    expect($validator->passes())->toBeFalse()
        ->and($validator->errors()->first('invitation'))->toBe('This invitation is invalid or has expired.');
});

it('rejects an expired invitation', function (): void {
    $user = User::factory()->create();
    $invitation = TeamInvitation::factory()->expired()->create(['email' => $user->email]);

    expect(validInvitationValidator($user, $invitation)->passes())->toBeFalse();
});

it('rejects an accepted invitation', function (): void {
    $user = User::factory()->create();
    $invitation = TeamInvitation::factory()->accepted()->create(['email' => $user->email]);

    expect(validInvitationValidator($user, $invitation)->passes())->toBeFalse();
});

it('rejects values that are not invitations', function (): void {
    expect(validInvitationValidator(User::factory()->create(), 'nope')->passes())->toBeFalse();
});
