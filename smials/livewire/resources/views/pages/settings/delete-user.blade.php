<section class="mt-10 space-y-6">
    <div class="relative mb-5">
        <flux:heading>{{ __('Delete account') }}</flux:heading>
        <flux:subheading>{{ __('Delete your account and all of its resources') }}</flux:subheading>
    </div>

    <flux:callout variant="danger" icon="exclamation-triangle" :heading="__('Warning')">
        <flux:callout.text>{{ __('Please proceed with caution, this cannot be undone.') }}</flux:callout.text>
    </flux:callout>

    <flux:modal.trigger name="confirm-user-deletion">
        <flux:button variant="danger" data-test="delete-user-button"> {{ __('Delete account') }} </flux:button>
    </flux:modal.trigger>

    <flux:modal name="confirm-user-deletion" :show="$errors->has('password')" focusable class="max-w-lg">
        <form method="POST" action="{{ route('user.destroy') }}" class="space-y-6">
            @csrf
            @method('DELETE')

            <div>
                <flux:heading size="lg">{{ __('Are you sure you want to delete your account?') }}</flux:heading>

                <flux:subheading>
                    {{ __('Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.') }}
                </flux:subheading>
            </div>

            <flux:input
                name="password"
                :label="__('Password')"
                type="password"
                :placeholder="__('Password')"
                viewable
            />

            <div class="flex justify-end space-x-2 rtl:space-x-reverse">
                <flux:modal.close>
                    <flux:button variant="filled">{{ __('Cancel') }}</flux:button>
                </flux:modal.close>

                <flux:button variant="danger" type="submit" data-test="confirm-delete-user-button">
                    {{ __('Delete account') }}
                </flux:button>
            </div>
        </form>
    </flux:modal>
</section>
