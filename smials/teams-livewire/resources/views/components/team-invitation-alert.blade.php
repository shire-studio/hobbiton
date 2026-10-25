@props([
    'teamName',
    'action',
])

<div data-test="team-invitation-alert">
    <flux:callout color="blue" icon="information-circle">
        <flux:callout.text>{{ $action }} to join the "{{ $teamName }}" team.</flux:callout.text>
    </flux:callout>
</div>
