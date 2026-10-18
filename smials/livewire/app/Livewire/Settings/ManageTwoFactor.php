<?php

declare(strict_types=1);

namespace App\Livewire\Settings;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Livewire\Attributes\Locked;
use Livewire\Attributes\On;
use Livewire\Component;

final class ManageTwoFactor extends Component
{
    #[Locked]
    public bool $canManageTwoFactor = false;

    #[Locked]
    public bool $requiresConfirmation = false;

    #[Locked]
    public bool $twoFactorEnabled = false;

    #[On('two-factor-enabled')]
    public function onTwoFactorEnabled(): void
    {
        $this->twoFactorEnabled = true;
    }

    public function disable(DisableTwoFactorAuthentication $disableTwoFactorAuthentication): void
    {
        $user = $this->user();

        $disableTwoFactorAuthentication($user);

        $this->twoFactorEnabled = false;
    }

    public function render(): View
    {
        return view('livewire.settings.manage-two-factor');
    }

    private function user(): User
    {
        $user = Auth::user();
        assert($user instanceof User);

        return $user;
    }
}
