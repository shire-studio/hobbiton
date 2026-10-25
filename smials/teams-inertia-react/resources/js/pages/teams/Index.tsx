import { Eye, LogOut, Pencil, Plus } from 'lucide-react'
import { edit, index } from '@/routes/teams'
import type { BreadcrumbItem } from '@/types'

type Props = {
  teams: App.Data.TeamData[]
}

const breadcrumbItems: BreadcrumbItem[] = [
  {
    title: 'Teams',
    href: index(),
  },
]

const canLeaveTeam = (team: App.Data.TeamData) =>
  !team.is_personal && team.role !== 'owner'

export default function Index({ teams }: Props) {
  const [leaveTeamDialogOpen, setLeaveTeamDialogOpen] = useState(false)
  const [teamLeaving, setTeamLeaving] = useState<App.Data.TeamData | null>(null)

  const openLeaveTeamDialog = (team: App.Data.TeamData) => {
    setTeamLeaving(team)
    setLeaveTeamDialogOpen(true)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbItems}>
      <Head title="Teams" />

      <h1 className="sr-only">Teams</h1>

      <SettingsLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <Heading
              variant="small"
              title="Teams"
              description="Manage your teams and team memberships"
            />

            <CreateTeamModal>
              <UiButton data-test="create-team-button">
                <Plus /> New team
              </UiButton>
            </CreateTeamModal>
          </div>

          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{team.name}</span>
                      {team.is_personal && (
                        <UiBadge variant="secondary">Personal</UiBadge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {team.role_label}
                    </span>
                  </div>
                </div>

                <UiTooltipProvider>
                  <div className="flex items-center gap-2">
                    {canLeaveTeam(team) && (
                      <UiTooltip>
                        <UiTooltipTrigger asChild>
                          <UiButton
                            variant="ghost"
                            size="sm"
                            onClick={() => openLeaveTeamDialog(team)}
                          >
                            <LogOut className="h-4 w-4" />
                          </UiButton>
                        </UiTooltipTrigger>
                        <UiTooltipContent>
                          <p>Leave team</p>
                        </UiTooltipContent>
                      </UiTooltip>
                    )}

                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <UiButton variant="ghost" size="sm" asChild>
                          <Link href={edit(team.slug)}>
                            {team.role === 'member' ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </Link>
                        </UiButton>
                      </UiTooltipTrigger>
                      <UiTooltipContent>
                        <p>
                          {team.role === 'member' ? 'View team' : 'Edit team'}
                        </p>
                      </UiTooltipContent>
                    </UiTooltip>
                  </div>
                </UiTooltipProvider>
              </div>
            ))}

            {teams.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                You don't belong to any teams yet.
              </p>
            )}
          </div>
        </div>

        <LeaveTeamModal
          team={teamLeaving}
          open={leaveTeamDialogOpen}
          onOpenChange={setLeaveTeamDialogOpen}
        />
      </SettingsLayout>
    </AppLayout>
  )
}
