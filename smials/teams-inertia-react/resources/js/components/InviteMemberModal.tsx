import { store as storeInvitation } from '@/routes/teams/invitations'

type Props = {
  team: App.Data.TeamData
  availableRoles: { value: string; label: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InviteMemberModal({
  team,
  availableRoles,
  open,
  onOpenChange,
}: Props) {
  const [inviteRole, setInviteRole] = useState('member')
  const [formKey, setFormKey] = useState(0)

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value)

    if (!value) {
      setInviteRole('member')
      setFormKey((key) => key + 1)
    }
  }

  return (
    <UiDialog open={open} onOpenChange={handleOpenChange}>
      <UiDialogContent>
        <Form
          key={formKey}
          {...storeInvitation.form(team.slug)}
          className="space-y-6"
          onSuccess={() => onOpenChange(false)}
        >
          {({ errors, processing }) => (
            <>
              <UiDialogHeader>
                <UiDialogTitle>Invite a team member</UiDialogTitle>
                <UiDialogDescription>
                  Send an invitation to join this team.
                </UiDialogDescription>
              </UiDialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <UiLabel htmlFor="invite-email">Email address</UiLabel>
                  <UiInput
                    id="invite-email"
                    name="email"
                    data-test="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    required
                  />
                  <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                  <UiLabel htmlFor="invite-role">Role</UiLabel>
                  <UiSelect
                    name="role"
                    value={inviteRole}
                    onValueChange={setInviteRole}
                  >
                    <UiSelectTrigger id="invite-role" className="w-full">
                      <UiSelectValue placeholder="Select a role" />
                    </UiSelectTrigger>
                    <UiSelectContent>
                      {availableRoles.map((role) => (
                        <UiSelectItem key={role.value} value={role.value}>
                          {role.label}
                        </UiSelectItem>
                      ))}
                    </UiSelectContent>
                  </UiSelect>
                  <InputError message={errors.role} />
                </div>
              </div>

              <UiDialogFooter className="gap-2">
                <UiDialogClose asChild>
                  <UiButton variant="secondary">Cancel</UiButton>
                </UiDialogClose>

                <UiButton
                  type="submit"
                  data-test="invite-submit"
                  disabled={processing}
                >
                  Send invitation
                </UiButton>
              </UiDialogFooter>
            </>
          )}
        </Form>
      </UiDialogContent>
    </UiDialog>
  )
}
