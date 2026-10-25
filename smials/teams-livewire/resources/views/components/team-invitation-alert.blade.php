@props([
    'teamName',
    'action',
])

<div data-test="team-invitation-alert">
    <flux:callout color="blue" icon="information-circle">
        <flux:callout.text>
            {{ __(':action to join the ":team" team.', ['action' => $action, 'team' => $teamName]) }}</flux:callout.text>
    </flux:callout>
</div>
