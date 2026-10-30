@props([
    'team',
])

{{-- Reopens after its own validation error, marked by the hidden `form` input, because several forms on the page share the `name` field. --}}
<flux:modal name="delete-team" focusable class="max-w-lg">
    <form
        method="POST"
        action="{{ route('teams.destroy', ['team' => $team->slug]) }}"
        class="space-y-6"
        x-data="{ confirmation: '' }"
    >
        @csrf
        @method('DELETE')
        <input type="hidden" name="form" value="delete-team" />

        <div>
            <flux:heading size="lg">{{ __('Are you sure?') }}</flux:heading>
            <flux:subheading>
                {{ __('This action cannot be undone. This will permanently delete the team') }}
                <strong>"{{ $team->name }}"</strong>.
            </flux:subheading>
        </div>

        <flux:field>
            <flux:label> {{ __('Type') }} <strong>"{{ $team->name }}"</strong> {{ __('to confirm') }} </flux:label>
            <flux:input
                input:name="name"
                :invalid="old('form') === 'delete-team' && $errors->has('name')"
                x-model="confirmation"
                :placeholder="__('Enter team name')"
                autocomplete="off"
                data-test="delete-team-name"
            />
            @if (old('form') === 'delete-team')
                <flux:error name="name" />
            @endif
        </flux:field>

        <div class="flex justify-end space-x-2 rtl:space-x-reverse">
            <flux:modal.close>
                <flux:button variant="filled">{{ __('Cancel') }}</flux:button>
            </flux:modal.close>

            <flux:button
                variant="danger"
                type="submit"
                x-bind:disabled="confirmation !== {{ Js::from($team->name) }}"
                data-test="delete-team-submit"
            >
                {{ __('Delete team') }}
            </flux:button>
        </div>
    </form>
</flux:modal>

@if ($errors->has('name') && old('form') === 'delete-team')
    <div x-data x-init="$nextTick(() => $flux.modal('delete-team').show())" data-test="delete-team-reopen"></div>
@endif
