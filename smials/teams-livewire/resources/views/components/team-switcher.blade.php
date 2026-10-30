{{-- Flux wraps the label in a span, so `[&>span]:min-w-0` lets the team name truncate instead of overflowing. --}}
<div @class(['min-w-0' => $inHeader, 'w-full' => ! $inHeader])>
    <flux:dropdown
        :position="$inHeader ? 'bottom' : 'right'"
        align="start"
        :class="$inHeader ? 'max-w-full' : 'w-full'"
    >
        <flux:button
            variant="ghost"
            icon="users"
            icon:trailing="chevrons-up-down"
            data-test="team-switcher"
            :class="$inHeader ? 'min-w-0 [&>span]:min-w-0' : 'w-full justify-start [&>span]:min-w-0'"
        >
            <span @class(['block truncate font-medium', 'lg:max-w-[120px]' => $inHeader])>{{ $currentTeam?->name ?? __('Select team') }}</span>
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
