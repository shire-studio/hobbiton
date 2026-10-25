{{-- Opens from any `<flux:modal.trigger name="create-team">`. Render it once per page; the team switcher already does. --}}
<flux:modal name="create-team" :show="$errors->has('name')" focusable class="max-w-lg">
    <form method="POST" action="{{ route('teams.store') }}" class="space-y-6">
        @csrf

        <div>
            <flux:heading size="lg">{{ __('Create a new team') }}</flux:heading>
            <flux:subheading>{{ __('Create a new team to collaborate with others.') }}</flux:subheading>
        </div>

        <flux:input
            id="create-team-name"
            name="name"
            :label="__('Team name')"
            :value="old('name')"
            :placeholder="__('My team')"
            required
            data-test="create-team-name"
        />

        <div class="flex justify-end space-x-2 rtl:space-x-reverse">
            <flux:modal.close>
                <flux:button variant="filled">{{ __('Cancel') }}</flux:button>
            </flux:modal.close>

            <flux:button variant="primary" type="submit" data-test="create-team-submit">
                {{ __('Create team') }}
            </flux:button>
        </div>
    </form>
</flux:modal>
