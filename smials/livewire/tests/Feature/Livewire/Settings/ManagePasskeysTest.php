<?php

declare(strict_types=1);

use App\Livewire\Settings\ManagePasskeys;
use App\Models\Passkey;
use App\Models\User;
use Livewire\Livewire;

it('lists the users passkeys', function (): void {
    $user = User::factory()->create();

    $passkey = Passkey::factory()->for($user)->create([
        'name' => 'My Mac',
        'created_at' => now()->subDays(2),
        'last_used_at' => now()->subHour(),
    ]);

    Passkey::factory()->create(['name' => 'Someone else']);

    $component = Livewire::actingAs($user)
        ->test(ManagePasskeys::class, ['canManagePasskeys' => true]);

    expect($component->instance()->passkeys())->toBe([[
        'id' => $passkey->id,
        'name' => 'My Mac',
        'authenticator' => null,
        'created_at_diff' => '2 days ago',
        'last_used_at_diff' => '1 hour ago',
    ]]);

    $component->assertSee('My Mac')
        ->assertDontSee('Someone else');
});

it('shows an empty state without passkeys', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(ManagePasskeys::class, ['canManagePasskeys' => true])
        ->assertSee('No passkeys yet');
});

it('renders nothing when passkeys cannot be managed', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(ManagePasskeys::class, ['canManagePasskeys' => false])
        ->assertDontSee('Passkeys');
});

it('confirms and deletes a passkey', function (): void {
    $user = User::factory()->create();
    $passkey = Passkey::factory()->for($user)->create(['name' => 'My Mac']);

    $component = Livewire::actingAs($user)
        ->test(ManagePasskeys::class, ['canManagePasskeys' => true])
        ->call('confirmDelete', $passkey->id)
        ->assertSet('deletingPasskeyId', $passkey->id)
        ->assertSet('showDeleteModal', true);

    expect($component->instance()->deletingPasskeyName())->toBe('My Mac');

    $component->call('deletePasskey')
        ->assertSet('deletingPasskeyId', null)
        ->assertSet('showDeleteModal', false);

    expect(Passkey::query()->find($passkey->id))->toBeNull();
});

it('cannot delete another users passkey', function (): void {
    $passkey = Passkey::factory()->create();

    Livewire::actingAs(User::factory()->create())
        ->test(ManagePasskeys::class, ['canManagePasskeys' => true])
        ->call('confirmDelete', $passkey->id)
        ->assertNotFound();
});

it('has no passkey name before a delete is confirmed', function (): void {
    $component = Livewire::actingAs(User::factory()->create())
        ->test(ManagePasskeys::class, ['canManagePasskeys' => true]);

    expect($component->instance()->deletingPasskeyName())->toBe('');
});

it('closes the delete modal', function (): void {
    $user = User::factory()->create();
    $passkey = Passkey::factory()->for($user)->create();

    Livewire::actingAs($user)
        ->test(ManagePasskeys::class, ['canManagePasskeys' => true])
        ->call('confirmDelete', $passkey->id)
        ->call('closeDeleteModal')
        ->assertSet('deletingPasskeyId', null)
        ->assertSet('showDeleteModal', false);
});
