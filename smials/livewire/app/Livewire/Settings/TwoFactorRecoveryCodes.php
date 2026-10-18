<?php

declare(strict_types=1);

namespace App\Livewire\Settings;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Livewire\Attributes\Locked;
use Livewire\Component;

final class TwoFactorRecoveryCodes extends Component
{
    /**
     * @var array<array-key, mixed>
     */
    #[Locked]
    public array $recoveryCodes = [];

    public function mount(): void
    {
        $user = $this->user();

        $this->recoveryCodes = $user->recoveryCodes();
    }

    public function regenerateRecoveryCodes(GenerateNewRecoveryCodes $generateNewRecoveryCodes): void
    {
        $user = $this->user();

        $generateNewRecoveryCodes($user);

        $this->recoveryCodes = $user->refresh()->recoveryCodes();
    }

    public function render(): View
    {
        return view('livewire.settings.two-factor-recovery-codes');
    }

    private function user(): User
    {
        $user = Auth::user();
        assert($user instanceof User);

        return $user;
    }
}
