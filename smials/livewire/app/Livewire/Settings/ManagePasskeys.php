<?php

declare(strict_types=1);

namespace App\Livewire\Settings;

use App\Models\Passkey;
use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;
use Laravel\Passkeys\Actions\DeletePasskey;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

final class ManagePasskeys extends Component
{
    #[Locked]
    public bool $canManagePasskeys = false;

    #[Locked]
    public ?string $deletingPasskeyId = null;

    public bool $showDeleteModal = false;

    /**
     * @return array<int, array{id: string, name: string, authenticator: string|null, created_at_diff: string, last_used_at_diff: string|null}>
     */
    #[Computed]
    public function passkeys(): array
    {
        return Passkey::query()
            ->whereBelongsTo($this->user())
            ->select(['id', 'name', 'credential', 'created_at', 'last_used_at'])
            ->latest()
            ->get()
            ->map(fn (Passkey $passkey): array => [
                'id' => $passkey->id,
                'name' => $passkey->name,
                'authenticator' => $passkey->authenticator,
                'created_at_diff' => $passkey->created_at_diff,
                'last_used_at_diff' => $passkey->last_used_at_diff,
            ])
            ->values()
            ->all();
    }

    #[Computed]
    public function deletingPasskeyName(): string
    {
        return Passkey::query()
            ->whereBelongsTo($this->user())
            ->find($this->deletingPasskeyId)
            ->name ?? '';
    }

    public function confirmDelete(string $passkeyId): void
    {
        $this->deletingPasskeyId = Passkey::query()
            ->whereBelongsTo($this->user())
            ->findOrFail($passkeyId)
            ->id;
        $this->showDeleteModal = true;
    }

    public function deletePasskey(DeletePasskey $deletePasskey): void
    {
        $user = $this->user();

        $passkey = Passkey::query()
            ->whereBelongsTo($user)
            ->findOrFail($this->deletingPasskeyId);

        $deletePasskey($user, $passkey);

        $this->closeDeleteModal();
    }

    public function closeDeleteModal(): void
    {
        $this->reset('deletingPasskeyId', 'showDeleteModal');
    }

    public function render(): View
    {
        return view('livewire.settings.manage-passkeys');
    }

    private function user(): User
    {
        $user = Auth::user();
        assert($user instanceof User);

        return $user;
    }
}
