<x-layouts::app :title="__('Teams')">
    <section class="w-full">
        @include('partials.settings-heading')

        <flux:heading level="2" class="sr-only">{{ __('Teams') }}</flux:heading>

        <x-pages::settings.layout :heading="__('Teams')" :subheading="__('Manage your teams and team memberships')">
            <div class="mt-6 space-y-6">
                <div class="flex justify-end">
                    <flux:modal.trigger name="create-team">
                        <flux:button variant="primary" icon="plus" data-test="create-team-button">
                            {{ __('New team') }}
                        </flux:button>
                    </flux:modal.trigger>
                </div>

                <div class="space-y-3">
                    @forelse ($teams as $team)
                        <div class="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="font-medium">{{ $team['name'] }}</span>
                                    @if ($team['is_personal'])
                                        <flux:badge size="sm">{{ __('Personal') }}</flux:badge>
                                    @endif
                                </div>
                                <flux:text size="sm">{{ $team['role_label'] }}</flux:text>
                            </div>

                            <div class="flex items-center gap-2">
                                @if (! $team['is_personal'] && $team['role'] !== 'owner')
                                    <flux:modal.trigger :name="'leave-team-'.$team['id']">
                                        <flux:button
                                            variant="ghost"
                                            size="sm"
                                            icon="arrow-right-start-on-rectangle"
                                            :tooltip="__('Leave team')"
                                            :aria-label="__('Leave team')"
                                            data-test="leave-team"
                                        />
                                    </flux:modal.trigger>
                                @endif

                                <flux:button
                                    variant="ghost"
                                    size="sm"
                                    :icon="$team['role'] === 'member' ? 'eye' : 'pencil'"
                                    :href="route('teams.edit', ['team' => $team['slug']])"
                                    :tooltip="$team['role'] === 'member' ? __('View team') : __('Edit team')"
                                    :aria-label="$team['role'] === 'member' ? __('View team') : __('Edit team')"
                                    wire:navigate
                                />
                            </div>
                        </div>

                        @if (! $team['is_personal'] && $team['role'] !== 'owner')
                            <x-leave-team-modal :team="$team" />
                        @endif
                    @empty
                        <p class="py-8 text-center text-zinc-500 dark:text-zinc-400">
                            {{ __("You don't belong to any teams yet.") }}
                        </p>
                    @endforelse
                </div>
            </div>
        </x-pages::settings.layout>
    </section>
</x-layouts::app>
