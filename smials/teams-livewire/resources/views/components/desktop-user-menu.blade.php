@props(['currentTeam' => null])

<flux:dropdown position="bottom" align="start">
    <button
        type="button"
        class="group flex w-full items-center rounded-lg p-1 text-start hover:bg-zinc-800/5 dark:hover:bg-white/10"
        data-test="sidebar-menu-button"
    >
        <flux:avatar size="sm" :name="auth()->user()->name" />
        <span class="mx-2 grid min-w-0 flex-1 text-sm leading-tight in-data-flux-sidebar-collapsed-desktop:hidden">
            <span class="truncate font-medium text-zinc-800 dark:text-white">{{ auth()->user()->name }}</span>
            @if ($currentTeam)
                <span
                    class="truncate text-xs text-zinc-500 dark:text-white/70"
                    data-test="current-team-name"
                >{{ $currentTeam->name }}</span>
            @endif
        </span>
        <flux:icon.chevrons-up-down
            variant="micro"
            class="me-2 shrink-0 text-zinc-400 in-data-flux-sidebar-collapsed-desktop:hidden"
        />
    </button>

    <flux:menu>
        <div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <flux:avatar :name="auth()->user()->name" />
            <div class="grid flex-1 text-start text-sm leading-tight">
                <flux:heading class="truncate">{{ auth()->user()->name }}</flux:heading>
                <flux:text class="truncate">{{ auth()->user()->email }}</flux:text>
            </div>
        </div>
        <flux:menu.separator />
        <flux:menu.radio.group>
            <flux:menu.item :href="route('user-profile.edit')" icon="cog" wire:navigate>
                {{ __('Settings') }}
            </flux:menu.item>
            <form method="POST" action="{{ route('logout') }}" class="w-full">
                @csrf
                <flux:menu.item
                    as="button"
                    type="submit"
                    icon="arrow-right-start-on-rectangle"
                    class="w-full cursor-pointer"
                    data-test="logout-button"
                >
                    {{ __('Log out') }}
                </flux:menu.item>
            </form>
        </flux:menu.radio.group>
    </flux:menu>
</flux:dropdown>
