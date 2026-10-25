<div class="w-full">
    <flux:dropdown :position="$inHeader ? 'bottom' : 'right'" align="start">
        <flux:button
            variant="ghost"
            icon="users"
            icon:trailing="chevrons-up-down"
            data-test="team-switcher"
            :class="$inHeader ? '' : 'w-full justify-start'"
        >
            <span class="max-w-[120px] truncate font-medium">{{ $currentTeam?->name ?? __('Select team') }}</span>
        </flux:button>

        <flux:menu class="min-w-56">
            <flux:menu.heading>{{ __('Teams') }}</flux:menu.heading>

            @foreach ($teams as $team)
                <form method="POST" action="{{ route('teams.switch', ['team' => $team->slug]) }}" class="w-full">
                    @csrf
                    <flux:menu.item
                        as="button"
                        type="submit"
                        class="w-full cursor-pointer"
                        data-test="team-switcher-item"
                    >
                        {{ $team->name }}
                        @if ($currentTeam?->is($team))
                            <flux:icon.check class="ms-auto size-4" />
                        @endif
                    </flux:menu.item>
                </form>
            @endforeach

            <flux:menu.separator />

            <flux:modal.trigger name="create-team">
                <flux:menu.item icon="plus" class="cursor-pointer" data-test="team-switcher-new-team">
                    <span class="text-zinc-500 dark:text-zinc-400">{{ __('New team') }}</span>
                </flux:menu.item>
            </flux:modal.trigger>
        </flux:menu>
    </flux:dropdown>

    <x-create-team-modal />
</div>
