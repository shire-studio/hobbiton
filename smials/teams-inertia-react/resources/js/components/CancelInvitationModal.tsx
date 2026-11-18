import { destroy as destroyInvitation } from '@/routes/teams/invitations'

type Props = {
  team: App.Data.TeamData
  invitation: App.Data.TeamInvitationData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CancelInvitationModal({
  team,
  invitation,
  open,
  onOpenChange,
}: Props) {
  const [processing, setProcessing] = useState(false)

  const cancelInvitation = () => {
    if (!invitation) {
      return
    }

    router.visit(destroyInvitation([team.slug, invitation.code]), {
      preserveScroll: true,
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <UiDialog open={open} onOpenChange={onOpenChange}>
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>Cancel invitation</UiDialogTitle>
          <UiDialogDescription>
            Are you sure you want to cancel the invitation for{' '}
            <strong>{invitation?.email}</strong>?
          </UiDialogDescription>
        </UiDialogHeader>

        <UiDialogFooter className="gap-2">
          <UiDialogClose asChild>
            <UiButton variant="secondary">Keep invitation</UiButton>
          </UiDialogClose>

          <UiButton
            data-test="cancel-invitation-confirm"
            variant="destructive"
            disabled={processing}
            onClick={cancelInvitation}
          >
            Cancel invitation
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  )
}
