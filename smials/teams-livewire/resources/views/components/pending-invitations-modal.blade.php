@props([
    'invitations',
])

<flux:modal
    name="pending-invitations"
    class="max-w-lg"
    x-data
    x-init="$nextTick(() => $flux.modal('pending-invitations').show())"
>
    <div class="space-y-6">
        <div>
            <flux:heading size="lg">{{ __('Pending team invitations') }}</flux:heading>
            <flux:subheading>{{ __('Accept or decline the teams you have been invited to join.') }}</flux:subheading>
        </div>

        <div class="grid gap-4">
            @foreach ($invitations as $invitation)
                <div data-test="pending-invitation" class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                    <div class="space-y-1">
                        <flux:heading>{{ $invitation->team->name }}</flux:heading>
                        <flux:text size="sm">{{ __(':name invited you to join this team.', ['name' => $invitation->inviter->name]) }}</flux:text>
                    </div>

                    <div class="mt-4 flex justify-end gap-2">
                        <form
                            method="POST"
                            action="{{ route('invitations.decline', ['invitation' => $invitation->code]) }}"
                        >
                            @csrf
                            @method('DELETE')
                            <flux:button
                                variant="filled"
                                type="submit"
                                data-test="decline-invitation"
                            >{{ __('Decline') }}</flux:button>
                        </form>

                        <form
                            method="POST"
                            action="{{ route('invitations.accept', ['invitation' => $invitation->code]) }}"
                        >
                            @csrf
                            <flux:button
                                variant="primary"
                                type="submit"
                                data-test="accept-invitation"
                            >{{ __('Accept') }}</flux:button>
                        </form>
                    </div>
                </div>
            @endforeach

            @error('invitation')
                <flux:text class="text-red-500 dark:text-red-400">{{ $message }}</flux:text>
            @enderror
        </div>
    </div>
</flux:modal>
