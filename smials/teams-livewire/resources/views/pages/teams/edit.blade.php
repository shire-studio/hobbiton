@php
    $pageTitle = $permissions['can_update_team']
        ? __('Edit :name', ['name' => $team->name])
        : __('View :name', ['name' => $team->name]);
    $form = old('form');
@endphp

{{--
    Several forms on this page (and the create team modal) post a `name` or `role` field, so each form posts a hidden
    `form` marker. A form shows its errors, and its modal reopens, only when `old('form')` matches its marker. Flux would
    mark every input with an errored name invalid, so these inputs pass `input:name` and an `:invalid` scoped to the marker.
--}}
<x-layouts::app :title="$pageTitle">
    <section class="w-full">
        @include('partials.settings-heading')

        <flux:heading level="2" class="sr-only">{{ $pageTitle }}</flux:heading>

        <x-pages::settings.layout
            :heading="$permissions['can_update_team'] ? __('Team settings') : $team->name"
            :subheading="$permissions['can_update_team'] ? __('Update your team name and settings') : ''"
        >
            <div class="mt-6 flex flex-col space-y-10">
                @if ($permissions['can_update_team'])
                    <form method="POST" action="{{ route('teams.update', ['team' => $team->slug]) }}" class="space-y-6">
                        @csrf
                        @method('PATCH')
                        <input type="hidden" name="form" value="rename-team" />

                        <flux:field>
                            <flux:label>{{ __('Team name') }}</flux:label>
                            <flux:input
                                id="name"
                                input:name="name"
                                :invalid="$form === 'rename-team' && $errors->has('name')"
                                :value="$form === 'rename-team' ? old('name') : $team->name"
                                required
                                data-test="team-name"
                            />
                            @if ($form === 'rename-team')
                                <flux:error name="name" />
                            @endif
                        </flux:field>

                        <div class="flex items-center gap-4">
                            <flux:button variant="primary" type="submit" data-test="team-save">
                                {{ __('Save') }}
                            </flux:button>
                        </div>
                    </form>
                @endif

                <div class="space-y-6">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <flux:heading>{{ __('Team members') }}</flux:heading>
                            @if ($permissions['can_create_invitation'])
                                <flux:subheading>{{ __('Manage who belongs to this team') }}</flux:subheading>
                            @endif
                        </div>

                        @if ($permissions['can_create_invitation'])
                            <flux:modal.trigger name="invite-member">
                                <flux:button variant="primary" icon="user-plus" data-test="invite-member-button">
                                    {{ __('Invite member') }}
                                </flux:button>
                            </flux:modal.trigger>
                        @endif
                    </div>

                    <div class="space-y-3">
                        @foreach ($members as $member)
                            <div
                                data-test="member-row"
                                class="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                            >
                                <div class="flex min-w-0 items-center gap-4">
                                    <flux:avatar :name="$member['name']" class="shrink-0" />
                                    <div class="min-w-0">
                                        <div class="truncate font-medium">{{ $member['name'] }}</div>
                                        <flux:text size="sm" class="truncate">{{ $member['email'] }}</flux:text>
                                    </div>
                                </div>

                                <div class="flex shrink-0 items-center gap-2">
                                    @if ($member['role'] !== 'owner' && $permissions['can_update_member'])
                                        <flux:dropdown align="end">
                                            <flux:button
                                                size="sm"
                                                icon:trailing="chevron-down"
                                                data-test="member-role"
                                            >{{ $member['role_label'] }}</flux:button>

                                            <flux:menu>
                                                @foreach ($availableRoles as $role)
                                                    <form
                                                        method="POST"
                                                        action="{{ route('teams.members.update', ['team' => $team->slug, 'user' => $member['id']]) }}"
                                                    >
                                                        @csrf
                                                        @method('PATCH')
                                                        <input type="hidden" name="form" value="member-role" />
                                                        <input type="hidden" name="role" value="{{ $role['value'] }}" />
                                                        <flux:menu.item
                                                            as="button"
                                                            type="submit"
                                                            class="w-full cursor-pointer"
                                                            data-test="member-role-option"
                                                        >
                                                            {{ $role['label'] }}</flux:menu.item>
                                                    </form>
                                                @endforeach
                                            </flux:menu>
                                        </flux:dropdown>
                                    @else
                                        <flux:badge size="sm">{{ $member['role_label'] }}</flux:badge>
                                    @endif

                                    @if ($member['role'] !== 'owner' && $permissions['can_remove_member'])
                                        <flux:modal.trigger :name="'remove-member-'.$member['id']">
                                            <flux:button
                                                variant="ghost"
                                                size="sm"
                                                icon="x-mark"
                                                :tooltip="__('Remove member')"
                                                :aria-label="__('Remove member')"
                                                data-test="remove-member"
                                            />
                                        </flux:modal.trigger>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>

                    @if ($form === 'member-role')
                        @error('role')
                            <flux:text class="text-red-500 dark:text-red-400">{{ $message }}</flux:text>
                        @enderror
                    @endif
                </div>

                @if (count($invitations) > 0)
                    <div class="space-y-6">
                        <div>
                            <flux:heading>{{ __('Pending invitations') }}</flux:heading>
                            <flux:subheading>{{ __("Invitations that haven't been accepted yet") }}</flux:subheading>
                        </div>

                        <div class="space-y-3">
                            @foreach ($invitations as $invitation)
                                <div class="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                                    <div class="flex min-w-0 items-center gap-4">
                                        <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                            <flux:icon.envelope class="size-5 text-zinc-500 dark:text-zinc-400" />
                                        </div>
                                        <div class="min-w-0">
                                            <div class="truncate font-medium">{{ $invitation->email }}</div>
                                            <flux:text size="sm">{{ $invitation->role->label() }}</flux:text>
                                        </div>
                                    </div>

                                    @if ($permissions['can_cancel_invitation'])
                                        <flux:modal.trigger :name="'cancel-invitation-'.$invitation->id">
                                            <flux:button
                                                variant="ghost"
                                                size="sm"
                                                icon="x-mark"
                                                class="shrink-0"
                                                :tooltip="__('Cancel invitation')"
                                                :aria-label="__('Cancel invitation')"
                                                data-test="cancel-invitation"
                                            />
                                        </flux:modal.trigger>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                @if ($permissions['can_delete_team'])
                    <div class="space-y-6">
                        <div>
                            <flux:heading>{{ __('Delete team') }}</flux:heading>
                            <flux:subheading>{{ __('Permanently delete your team') }}</flux:subheading>
                        </div>

                        <flux:callout variant="danger" icon="exclamation-triangle" :heading="__('Warning')">
                            <flux:callout.text>
                                {{ __('Please proceed with caution, this cannot be undone.') }}</flux:callout.text>
                        </flux:callout>

                        <flux:modal.trigger name="delete-team">
                            <flux:button variant="danger" data-test="delete-team">{{ __('Delete team') }}</flux:button>
                        </flux:modal.trigger>
                    </div>
                @endif
            </div>

            @if ($permissions['can_create_invitation'])
                <x-invite-member-modal :team="$team" :available-roles="$availableRoles" />
            @endif

            @if ($permissions['can_remove_member'])
                @foreach ($members as $member)
                    @if ($member['role'] !== 'owner')
                        <x-remove-member-modal :team="$team" :member="$member" />
                    @endif
                @endforeach
            @endif

            @if ($permissions['can_cancel_invitation'])
                @foreach ($invitations as $invitation)
                    <x-cancel-invitation-modal :team="$team" :invitation="$invitation" />
                @endforeach
            @endif

            @if ($permissions['can_delete_team'])
                <x-delete-team-modal :team="$team" />
            @endif
        </x-pages::settings.layout>
    </section>
</x-layouts::app>
