import { leave as leaveTeamAction } from '@/routes/teams'

type Props = {
  team: App.Data.TeamData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LeaveTeamModal({ team, open, onOpenChange }: Props) {
  const [processing, setProcessing] = useState(false)

  const leaveTeam = () => {
    if (!team) {
      return
    }

    router.visit(leaveTeamAction(team.slug), {
      onStart: () => setProcessing(true),
      onFinish: () => setProcessing(false),
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <UiDialog open={open} onOpenChange={onOpenChange}>
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>Leave team</UiDialogTitle>
          <UiDialogDescription>
            Are you sure you want to leave <strong>{team?.name}</strong>?
          </UiDialogDescription>
        </UiDialogHeader>

        <UiDialogFooter className="gap-2">
          <UiDialogClose asChild>
            <UiButton variant="secondary">Cancel</UiButton>
          </UiDialogClose>

          <UiButton
            data-test="leave-team-confirm"
            variant="destructive"
            disabled={processing}
            onClick={leaveTeam}
          >
            Leave team
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  )
}
