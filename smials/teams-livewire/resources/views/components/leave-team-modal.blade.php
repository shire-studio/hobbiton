@props([
    'team',
])

<flux:modal :name="'leave-team-'.$team['id']" class="max-w-lg">
    <form method="POST" action="{{ route('teams.leave', ['team' => $team['slug']]) }}" class="space-y-6">
        @csrf
        @method('DELETE')

        <div>
            <flux:heading size="lg">{{ __('Leave team') }}</flux:heading>
            <flux:subheading>
                {{ __('Are you sure you want to leave') }} <strong>{{ $team['name'] }}</strong>?
            </flux:subheading>
        </div>

        <div class="flex justify-end space-x-2 rtl:space-x-reverse">
            <flux:modal.close>
                <flux:button variant="filled">{{ __('Cancel') }}</flux:button>
            </flux:modal.close>

            <flux:button variant="danger" type="submit" data-test="leave-team-confirm">
                {{ __('Leave team') }}
            </flux:button>
        </div>
    </form>
</flux:modal>
