{{-- Opens from any `<flux:modal.trigger name="create-team">`. Render it once per page; the team switcher already does. Reopens after its own validation error, marked by the hidden `form` input. --}}
<flux:modal name="create-team" focusable class="max-w-lg">
    <form method="POST" action="{{ route('teams.store') }}" class="space-y-6">
        @csrf
        <input type="hidden" name="form" value="create-team" />

        <div>
            <flux:heading size="lg">{{ __('Create a new team') }}</flux:heading>
            <flux:subheading>{{ __('Create a new team to collaborate with others.') }}</flux:subheading>
        </div>

        <flux:field>
            <flux:label>{{ __('Team name') }}</flux:label>
            <flux:input
                id="create-team-name"
                input:name="name"
                :invalid="old('form') === 'create-team' && $errors->has('name')"
                :value="old('form') === 'create-team' ? old('name') : ''"
                :placeholder="__('My team')"
                required
                data-test="create-team-name"
            />
            @if (old('form') === 'create-team')
                <flux:error name="name" />
            @endif
        </flux:field>

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

@if ($errors->has('name') && old('form') === 'create-team')
    <div x-data x-init="$nextTick(() => $flux.modal('create-team').show())" data-test="create-team-reopen"></div>
@endif
