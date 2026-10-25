import { destroy as destroyMember } from '@/routes/teams/members'

type Props = {
  team: App.Data.TeamData
  member: App.Data.TeamMemberData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RemoveMemberModal({
  team,
  member,
  open,
  onOpenChange,
}: Props) {
  const [processing, setProcessing] = useState(false)

  const removeMember = () => {
    if (!member) {
      return
    }

    router.visit(destroyMember([team.slug, member.id]), {
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
          <UiDialogTitle>Remove team member</UiDialogTitle>
          <UiDialogDescription>
            Are you sure you want to remove <strong>{member?.name}</strong> from
            this team?
          </UiDialogDescription>
        </UiDialogHeader>

        <UiDialogFooter className="gap-2">
          <UiDialogClose asChild>
            <UiButton variant="secondary">Cancel</UiButton>
          </UiDialogClose>

          <UiButton
            variant="destructive"
            disabled={processing}
            onClick={removeMember}
          >
            Remove member
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  )
}
