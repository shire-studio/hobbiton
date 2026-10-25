@props([
    'team',
    'member',
])

<flux:modal :name="'remove-member-'.$member['id']" class="max-w-lg">
    <form
        method="POST"
        action="{{ route('teams.members.destroy', ['team' => $team->slug, 'user' => $member['id']]) }}"
        class="space-y-6"
    >
        @csrf
        @method('DELETE')

        <div>
            <flux:heading size="lg">{{ __('Remove team member') }}</flux:heading>
            <flux:subheading>
                {{ __('Are you sure you want to remove') }}
                <strong>{{ $member['name'] }}</strong> {{ __('from this team?') }}
            </flux:subheading>
        </div>

        <div class="flex justify-end space-x-2 rtl:space-x-reverse">
            <flux:modal.close>
                <flux:button variant="filled">{{ __('Cancel') }}</flux:button>
            </flux:modal.close>

            <flux:button variant="danger" type="submit" data-test="remove-member-confirm">
                {{ __('Remove member') }}
            </flux:button>
        </div>
    </form>
</flux:modal>
