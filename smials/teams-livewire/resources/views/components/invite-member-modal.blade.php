@props([
    'team',
    'availableRoles',
])

{{-- Reopens after its own validation errors, marked by the hidden `form` input. --}}
<flux:modal name="invite-member" focusable class="max-w-lg">
    <form method="POST" action="{{ route('teams.invitations.store', ['team' => $team->slug]) }}" class="space-y-6">
        @csrf
        <input type="hidden" name="form" value="invite-member" />

        <div>
            <flux:heading size="lg">{{ __('Invite a team member') }}</flux:heading>
            <flux:subheading>{{ __('Send an invitation to join this team.') }}</flux:subheading>
        </div>

        <flux:field>
            <flux:label>{{ __('Email address') }}</flux:label>
            <flux:input
                id="invite-email"
                name="email"
                type="email"
                :value="old('form') === 'invite-member' ? old('email') : ''"
                placeholder="colleague@example.com"
                required
                data-test="invite-email"
            />
            @if (old('form') === 'invite-member')
                <flux:error name="email" />
            @endif
        </flux:field>

        <flux:field>
            <flux:label>{{ __('Role') }}</flux:label>
            <flux:select name="role" id="invite-role">
                @foreach ($availableRoles as $role)
                    <flux:select.option
                        :value="$role['value']"
                        :selected="(old('form') === 'invite-member' ? old('role', 'member') : 'member') === $role['value']"
                    >
                        {{ $role['label'] }}</flux:select.option>
                @endforeach
            </flux:select>
            @if (old('form') === 'invite-member')
                <flux:error name="role" />
            @endif
        </flux:field>

        <div class="flex justify-end space-x-2 rtl:space-x-reverse">
            <flux:modal.close>
                <flux:button variant="filled">{{ __('Cancel') }}</flux:button>
            </flux:modal.close>

            <flux:button variant="primary" type="submit" data-test="invite-submit">
                {{ __('Send invitation') }}
            </flux:button>
        </div>
    </form>
</flux:modal>

@if (($errors->has('email') || $errors->has('role')) && old('form') === 'invite-member')
    <div x-data x-init="$nextTick(() => $flux.modal('invite-member').show())" data-test="invite-member-reopen"></div>
@endif
