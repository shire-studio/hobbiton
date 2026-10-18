<x-layouts::app :title="__('Security settings')">
    <section class="w-full">
        @include('partials.settings-heading')

        <flux:heading level="2" class="sr-only">{{ __('Security settings') }}</flux:heading>

        <x-pages::settings.layout
            :heading="__('Update password')"
            :subheading="__('Ensure your account is using a long, random password to stay secure')"
        >
            <form method="POST" action="{{ route('password.update') }}" class="mt-6 space-y-6">
                @csrf
                @method('PUT')

                <flux:input
                    name="current_password"
                    :label="__('Current password')"
                    type="password"
                    required
                    autocomplete="current-password"
                    :placeholder="__('Current password')"
                    viewable
                />
                <flux:input
                    name="password"
                    :label="__('New password')"
                    type="password"
                    required
                    autocomplete="new-password"
                    :placeholder="__('New password')"
                    viewable
                />
                <flux:input
                    name="password_confirmation"
                    :label="__('Confirm password')"
                    type="password"
                    required
                    autocomplete="new-password"
                    :placeholder="__('Confirm password')"
                    viewable
                />

                <div class="flex items-center gap-4">
                    <flux:button variant="primary" type="submit" data-test="update-password-button">
                        {{ __('Save') }}
                    </flux:button>
                </div>
            </form>

            <livewire:settings.manage-two-factor
                :can-manage-two-factor="$canManageTwoFactor"
                :requires-confirmation="$requiresConfirmation"
                :two-factor-enabled="$twoFactorEnabled"
            />

            <livewire:settings.manage-passkeys :can-manage-passkeys="$canManagePasskeys" />
        </x-pages::settings.layout>
    </section>
</x-layouts::app>
