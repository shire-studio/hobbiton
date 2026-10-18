<?php

declare(strict_types=1);

namespace App\Livewire\Settings;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Attributes\On;
use Livewire\Attributes\Validate;
use Livewire\Component;

final class TwoFactorSetupModal extends Component
{
    #[Locked]
    public bool $requiresConfirmation = false;

    #[Locked]
    public string $qrCodeSvg = '';

    #[Locked]
    public string $manualSetupKey = '';

    public bool $showVerificationStep = false;

    #[Validate('required|string|size:6', onUpdate: false)]
    public string $code = '';

    #[On('start-two-factor-setup')]
    public function startTwoFactorSetup(EnableTwoFactorAuthentication $enableTwoFactorAuthentication): void
    {
        $user = $this->user();

        $enableTwoFactorAuthentication($user);

        $user->refresh();

        $secret = $user->two_factor_secret;
        assert(is_string($secret));

        $manualSetupKey = decrypt($secret);
        assert(is_string($manualSetupKey));

        $this->qrCodeSvg = $user->twoFactorQrCodeSvg();
        $this->manualSetupKey = $manualSetupKey;
    }

    public function showVerificationIfNecessary(): void
    {
        if ($this->requiresConfirmation) {
            $this->showVerificationStep = true;

            $this->resetErrorBag();

            return;
        }

        $this->closeModal();

        $this->dispatch('two-factor-enabled');
    }

    public function confirmTwoFactor(ConfirmTwoFactorAuthentication $confirmTwoFactorAuthentication): void
    {
        $user = $this->user();

        $this->validate();

        $confirmTwoFactorAuthentication($user, $this->code);

        $this->closeModal();

        $this->dispatch('two-factor-enabled');
    }

    public function resetVerification(): void
    {
        $this->reset('code', 'showVerificationStep');

        $this->resetErrorBag();
    }

    public function closeModal(): void
    {
        $this->reset('code', 'manualSetupKey', 'qrCodeSvg', 'showVerificationStep');

        $this->resetErrorBag();
    }

    /**
     * @return array{title: string, description: string, buttonText: string}
     */
    #[Computed]
    public function modalConfig(): array
    {
        if ($this->showVerificationStep) {
            return [
                'title' => __('Verify authentication code'),
                'description' => __('Enter the 6-digit code from your authenticator app'),
                'buttonText' => __('Continue'),
            ];
        }

        return [
            'title' => __('Enable two-factor authentication'),
            'description' => __('To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app'),
            'buttonText' => __('Continue'),
        ];
    }

    public function render(): View
    {
        return view('livewire.settings.two-factor-setup-modal');
    }

    private function user(): User
    {
        $user = Auth::user();
        assert($user instanceof User);

        return $user;
    }
}
