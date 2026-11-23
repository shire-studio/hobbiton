@props([
    'team',
    'invitation',
])

<flux:modal :name="'cancel-invitation-'.$invitation->id" class="max-w-lg">
    <form
        method="POST"
        action="{{ route('teams.invitations.destroy', ['team' => $team->slug, 'invitation' => $invitation->code]) }}"
        class="space-y-6"
    >
        @csrf
        @method('DELETE')

        <div>
            <flux:heading size="lg">{{ __('Cancel invitation') }}</flux:heading>
            <flux:subheading>
                {{ __('Are you sure you want to cancel the invitation for') }}
                <strong>{{ $invitation->email }}</strong>?
            </flux:subheading>
        </div>

        <div class="flex justify-end space-x-2 rtl:space-x-reverse">
            <flux:modal.close>
                <flux:button variant="filled">{{ __('Keep invitation') }}</flux:button>
            </flux:modal.close>

            <flux:button variant="danger" type="submit" data-test="cancel-invitation-confirm">
                {{ __('Cancel invitation') }}
            </flux:button>
        </div>
    </form>
</flux:modal>
