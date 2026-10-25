import { ChevronDown, Mail, UserPlus, X } from 'lucide-react'
import { edit, index, update } from '@/routes/teams'
import { update as updateMember } from '@/routes/teams/members'
import type { BreadcrumbItem } from '@/types'

type Props = {
  team: App.Data.TeamData
  members: App.Data.TeamMemberData[]
  invitations: App.Data.TeamInvitationData[]
  permissions: App.Data.TeamPermissionsData
  availableRoles: { value: string; label: string }[]
}

export default function Edit({
  team,
  members,
  invitations,
  permissions,
  availableRoles,
}: Props) {
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      title: 'Teams',
      href: index(),
    },
    {
      title: team.name,
      href: edit(team.slug),
    },
  ]

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] =
    useState<App.Data.TeamMemberData | null>(null)
  const [cancelInvitationDialogOpen, setCancelInvitationDialogOpen] =
    useState(false)
  const [invitationToCancel, setInvitationToCancel] =
    useState<App.Data.TeamInvitationData | null>(null)

  const pageTitle = permissions.can_update_team
    ? `Edit ${team.name}`
    : `View ${team.name}`

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
    setMemberToRemove(member)
    setRemoveMemberDialogOpen(true)
  }

  const confirmCancelInvitation = (invitation: App.Data.TeamInvitationData) => {
    setInvitationToCancel(invitation)
    setCancelInvitationDialogOpen(true)
  }

  const canDeleteTeam = permissions.can_delete_team && !team.is_personal

  return (
    <AppLayout breadcrumbs={breadcrumbItems}>
      <Head title={pageTitle} />

      <h1 className="sr-only">{pageTitle}</h1>

      <SettingsLayout>
        <div className="flex flex-col space-y-10">
          {permissions.can_update_team ? (
            <div className="space-y-6">
              <Heading
                variant="small"
                title="Team settings"
                description="Update your team name and settings"
              />

              <Form
                {...update.form(team.slug)}
                options={{ preserveScroll: true }}
                className="space-y-6"
              >
                {({ errors, processing }) => (
                  <>
                    <div className="grid gap-2">
                      <UiLabel htmlFor="name">Team name</UiLabel>
                      <UiInput
                        id="name"
                        name="name"
                        data-test="team-name"
                        defaultValue={team.name}
                        required
                      />
                      <InputError message={errors.name} />
                    </div>

                    <div className="flex items-center gap-4">
                      <UiButton
                        type="submit"
                        data-test="team-save"
                        disabled={processing}
                      >
                        Save
                      </UiButton>
                    </div>
                  </>
                )}
              </Form>
            </div>
          ) : (
            <div className="space-y-6">
              <Heading variant="small" title={team.name} />
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Heading
                variant="small"
                title="Team members"
                description={
                  permissions.can_create_invitation
                    ? 'Manage who belongs to this team'
                    : ''
                }
              />

              {permissions.can_create_invitation && (
                <UiButton
                  data-test="invite-member-button"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <UserPlus /> Invite member
                </UiButton>
              )}
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <UiAvatar className="h-10 w-10">
                      <UiAvatarFallback>
                        {getInitials(member.name)}
                      </UiAvatarFallback>
                    </UiAvatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role !== 'owner' &&
                    permissions.can_update_member ? (
                      <UiDropdownMenu>
                        <UiDropdownMenuTrigger asChild>
                          <UiButton variant="outline" size="sm">
                            {member.role_label}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </UiButton>
                        </UiDropdownMenuTrigger>
                        <UiDropdownMenuContent>
                          {availableRoles.map((role) => (
                            <UiDropdownMenuItem
                              key={role.value}
                              onClick={() =>
                                updateMemberRole(member, role.value)
                              }
                            >
                              {role.label}
                            </UiDropdownMenuItem>
                          ))}
                        </UiDropdownMenuContent>
                      </UiDropdownMenu>
                    ) : (
                      <UiBadge variant="secondary">{member.role_label}</UiBadge>
                    )}

                    {member.role !== 'owner' &&
                      permissions.can_remove_member && (
                        <UiTooltipProvider>
                          <UiTooltip>
                            <UiTooltipTrigger asChild>
                              <UiButton
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmRemoveMember(member)}
                              >
                                <X className="h-4 w-4" />
                              </UiButton>
                            </UiTooltipTrigger>
                            <UiTooltipContent>
                              <p>Remove member</p>
                            </UiTooltipContent>
                          </UiTooltip>
                        </UiTooltipProvider>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {invitations.length > 0 && (
            <div className="space-y-6">
              <Heading
                variant="small"
                title="Pending invitations"
                description="Invitations that haven't been accepted yet"
              />

              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.code}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {invitation.role_label}
                        </div>
                      </div>
                    </div>

                    {permissions.can_cancel_invitation && (
                      <UiTooltipProvider>
                        <UiTooltip>
                          <UiTooltipTrigger asChild>
                            <UiButton
                              data-test="cancel-invitation"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                confirmCancelInvitation(invitation)
                              }
                            >
                              <X className="h-4 w-4" />
                            </UiButton>
                          </UiTooltipTrigger>
                          <UiTooltipContent>
                            <p>Cancel invitation</p>
                          </UiTooltipContent>
                        </UiTooltip>
                      </UiTooltipProvider>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canDeleteTeam && (
            <div className="space-y-6">
              <Heading
                variant="small"
                title="Delete team"
                description="Permanently delete your team"
              />
              <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                  <p className="font-medium">Warning</p>
                  <p className="text-sm">
                    Please proceed with caution, this cannot be undone.
                  </p>
                </div>
                <UiButton
                  data-test="delete-team"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete team
                </UiButton>
              </div>
            </div>
          )}
        </div>

        {permissions.can_create_invitation && (
          <InviteMemberModal
            team={team}
            availableRoles={availableRoles}
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
          />
        )}

        <RemoveMemberModal
          team={team}
          member={memberToRemove}
          open={removeMemberDialogOpen}
          onOpenChange={setRemoveMemberDialogOpen}
        />

        <CancelInvitationModal
          team={team}
          invitation={invitationToCancel}
          open={cancelInvitationDialogOpen}
          onOpenChange={setCancelInvitationDialogOpen}
        />

        {canDeleteTeam && (
          <DeleteTeamModal
            team={team}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        )}
      </SettingsLayout>
    </AppLayout>
  )
}
