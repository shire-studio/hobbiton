import { accept, decline } from '@/routes/invitations'

type Props = {
  invitations: App.Data.PendingTeamInvitationData[]
}

export default function PendingInvitationsModal({ invitations }: Props) {
  const page = usePage()
  const [open, setOpen] = useState(true)
  const [processingCode, setProcessingCode] = useState<string | null>(null)

  const respond = (
    invitation: App.Data.PendingTeamInvitationData,
    action: typeof accept | typeof decline,
  ) => {
    router.visit(action(invitation.code), {
      onStart: () => setProcessingCode(invitation.code),
      onFinish: () => setProcessingCode(null),
    })
  }

  return (
    <UiDialog open={open} onOpenChange={setOpen}>
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>Pending team invitations</UiDialogTitle>
          <UiDialogDescription>
            Accept or decline the teams you have been invited to join.
          </UiDialogDescription>
        </UiDialogHeader>

        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.code}
              data-test="pending-invitation"
              className="rounded-lg border p-4"
            >
              <div className="space-y-1">
                <p className="font-medium">{invitation.team_name}</p>
                <p className="text-sm text-muted-foreground">
                  {invitation.inviter_name} invited you to join this team.
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <UiButton
                  data-test="decline-invitation"
                  variant="secondary"
                  disabled={processingCode === invitation.code}
                  onClick={() => respond(invitation, decline)}
                >
                  Decline
                </UiButton>

                <UiButton
                  data-test="accept-invitation"
                  disabled={processingCode === invitation.code}
                  onClick={() => respond(invitation, accept)}
                >
                  Accept
                </UiButton>
              </div>
            </div>
          ))}

          <InputError message={page.props.errors.invitation} />
        </div>
      </UiDialogContent>
    </UiDialog>
  )
}
