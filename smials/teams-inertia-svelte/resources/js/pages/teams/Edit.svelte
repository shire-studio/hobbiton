<script lang="ts">
  import { ChevronDown, Mail, UserPlus, X } from '@lucide/svelte'
  import { edit, index, update } from '@/routes/teams'
  import { update as updateMember } from '@/routes/teams/members'
  import type { BreadcrumbItem } from '@/types'

  let {
    team,
    members,
    invitations,
    permissions,
    availableRoles,
  }: {
    team: App.Data.TeamData
    members: App.Data.TeamMemberData[]
    invitations: App.Data.TeamInvitationData[]
    permissions: App.Data.TeamPermissionsData
    availableRoles: { value: string; label: string }[]
  } = $props()

  const breadcrumbs: BreadcrumbItem[] = $derived([
    {
      title: 'Teams',
      href: index(),
    },
    {
      title: team.name,
      href: edit(team.slug),
    },
  ])

  let inviteDialogOpen = $state(false)
  let deleteDialogOpen = $state(false)
  let removeMemberDialogOpen = $state(false)
  let memberToRemove = $state<App.Data.TeamMemberData | null>(null)
  let cancelInvitationDialogOpen = $state(false)
  let invitationToCancel = $state<App.Data.TeamInvitationData | null>(null)

  const pageTitle = $derived(
    permissions.can_update_team ? `Edit ${team.name}` : `View ${team.name}`,
  )

  const updateMemberRole = (
    member: App.Data.TeamMemberData,
    newRole: string,
  ) => {
    router.visit(updateMember([team.slug, member.id]), {
      data: { role: newRole },
      preserveScroll: true,
    })
  }

  const confirmRemoveMember = (member: App.Data.TeamMemberData) => {
    memberToRemove = member
    removeMemberDialogOpen = true
  }

  const confirmCancelInvitation = (invitation: App.Data.TeamInvitationData) => {
    invitationToCancel = invitation
    cancelInvitationDialogOpen = true
  }
</script>

<AppLayout {breadcrumbs}>
  <AppHead title={pageTitle} />

  <h1 class="sr-only">{pageTitle}</h1>

  <SettingsLayout>
    <div class="flex flex-col space-y-10">
      {#if permissions.can_update_team}
        <div class="space-y-6">
          <Heading
            variant="small"
            title="Team settings"
            description="Update your team name and settings"
          />

          {#key team.id}
            <Form
              {...update.form(team.slug)}
              options={{ preserveScroll: true }}
              class="space-y-6"
            >
              {#snippet children({ errors, processing })}
                <div class="grid gap-2">
                  <UiLabel for="name">Team name</UiLabel>
                  <UiInput
                    id="name"
                    name="name"
                    data-test="team-name"
                    value={team.name}
                    required
                  />
                  <InputError message={errors.name} />
                </div>

                <div class="flex items-center gap-4">
                  <UiButton
                    type="submit"
                    data-test="team-save"
                    disabled={processing}
                  >
                    Save
                  </UiButton>
                </div>
              {/snippet}
            </Form>
          {/key}
        </div>
      {:else}
        <div class="space-y-6">
          <Heading variant="small" title={team.name} />
        </div>
      {/if}

      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <Heading
            variant="small"
            title="Team members"
            description={permissions.can_create_invitation
              ? 'Manage who belongs to this team'
              : ''}
          />

          {#if permissions.can_create_invitation}
            <UiButton
              data-test="invite-member-button"
              onclick={() => (inviteDialogOpen = true)}
            >
              <UserPlus /> Invite member
            </UiButton>
          {/if}
        </div>

        <div class="space-y-3">
          {#each members as member (member.id)}
            <div
              data-test="member-row"
              class="flex items-center justify-between rounded-lg border p-4"
            >
              <div class="flex items-center gap-4">
                <UiAvatar class="h-10 w-10">
                  <UiAvatarFallback>{getInitials(member.name)}</UiAvatarFallback
                  >
                </UiAvatar>
                <div>
                  <div class="font-medium">
                    {member.name}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {member.email}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                {#if member.role !== 'owner' && permissions.can_update_member}
                  <UiDropdownMenu>
                    <UiDropdownMenuTrigger asChild>
                      {#snippet children(props)}
                        <UiButton
                          data-test="member-role"
                          variant="outline"
                          size="sm"
                          onclick={props.onclick}
                          aria-expanded={props['aria-expanded']}
                          data-state={props['data-state']}
                        >
                          {member.role_label}
                          <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
                        </UiButton>
                      {/snippet}
                    </UiDropdownMenuTrigger>
                    <UiDropdownMenuContent>
                      {#each availableRoles as role (role.value)}
                        <UiDropdownMenuItem asChild>
                          {#snippet children(props)}
                            <button
                              type="button"
                              data-test="member-role-option"
                              class={props.class}
                              onclick={() => {
                                props.onClick?.()
                                updateMemberRole(member, role.value)
                              }}
                            >
                              {role.label}
                            </button>
                          {/snippet}
                        </UiDropdownMenuItem>
                      {/each}
                    </UiDropdownMenuContent>
                  </UiDropdownMenu>
                {:else}
                  <UiBadge variant="secondary">
                    {member.role_label}
                  </UiBadge>
                {/if}

                {#if member.role !== 'owner' && permissions.can_remove_member}
                  <UiTooltipProvider delayDuration={0}>
                    <UiTooltip>
                      <UiTooltipTrigger>
                        {#snippet child({ props })}
                          <UiButton
                            data-test="remove-member"
                            variant="ghost"
                            size="sm"
                            {...props}
                            onclick={() => confirmRemoveMember(member)}
                          >
                            <X class="h-4 w-4" />
                            <span class="sr-only">Remove member</span>
                          </UiButton>
                        {/snippet}
                      </UiTooltipTrigger>
                      <UiTooltipContent>
                        <p>Remove member</p>
                      </UiTooltipContent>
                    </UiTooltip>
                  </UiTooltipProvider>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <InputError message={page.props.errors.role} />
      </div>

      {#if invitations.length > 0}
        <div class="space-y-6">
          <Heading
            variant="small"
            title="Pending invitations"
            description="Invitations that haven't been accepted yet"
          />

          <div class="space-y-3">
            {#each invitations as invitation (invitation.code)}
              <div
                class="flex items-center justify-between rounded-lg border p-4"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
                  >
                    <Mail class="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div class="font-medium">
                      {invitation.email}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {invitation.role_label}
                    </div>
                  </div>
                </div>

                {#if permissions.can_cancel_invitation}
                  <UiTooltipProvider delayDuration={0}>
                    <UiTooltip>
                      <UiTooltipTrigger>
                        {#snippet child({ props })}
                          <UiButton
                            data-test="cancel-invitation"
                            variant="ghost"
                            size="sm"
                            {...props}
                            onclick={() => confirmCancelInvitation(invitation)}
                          >
                            <X class="h-4 w-4" />
                            <span class="sr-only">Cancel invitation</span>
                          </UiButton>
                        {/snippet}
                      </UiTooltipTrigger>
                      <UiTooltipContent>
                        <p>Cancel invitation</p>
                      </UiTooltipContent>
                    </UiTooltip>
                  </UiTooltipProvider>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if permissions.can_delete_team && !team.is_personal}
        <div class="space-y-6">
          <Heading
            variant="small"
            title="Delete team"
            description="Permanently delete your team"
          />
          <div
            class="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10"
          >
            <div class="relative space-y-0.5 text-red-600 dark:text-red-100">
              <p class="font-medium">Warning</p>
              <p class="text-sm">
                Please proceed with caution, this cannot be undone.
              </p>
            </div>
            <UiButton
              data-test="delete-team"
              variant="destructive"
              onclick={() => (deleteDialogOpen = true)}
            >
              Delete team
            </UiButton>
          </div>
        </div>
      {/if}
    </div>

    {#if permissions.can_create_invitation}
      <InviteMemberModal {team} {availableRoles} bind:open={inviteDialogOpen} />
    {/if}

    <RemoveMemberModal
      {team}
      member={memberToRemove}
      bind:open={removeMemberDialogOpen}
    />

    <CancelInvitationModal
      {team}
      invitation={invitationToCancel}
      bind:open={cancelInvitationDialogOpen}
    />

    {#if permissions.can_delete_team && !team.is_personal}
      <DeleteTeamModal {team} bind:open={deleteDialogOpen} />
    {/if}
  </SettingsLayout>
</AppLayout>
