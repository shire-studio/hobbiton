import { Check, ChevronsUpDown, Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { switchMethod } from '@/routes/teams'

type Props = {
  inHeader?: boolean
}

export default function TeamSwitcher({ inHeader = false }: Props) {
  const { currentTeam, teams } = usePage().props
  const isMobile = useIsMobile()

  const teamItemClass = inHeader
    ? 'cursor-pointer gap-2'
    : 'cursor-pointer gap-2 p-2'

  const switchTeam = (team: App.Data.TeamData) => {
    router.visit(switchMethod(team.slug))
  }

  return (
    <UiDropdownMenu>
      <UiDropdownMenuTrigger asChild>
        <UiButton
          data-test="team-switcher"
          variant="ghost"
          className={
            inHeader
              ? 'h-8 gap-1 px-2'
              : 'w-full justify-start px-2 has-[>svg]:px-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          }
        >
          <Users
            className={
              inHeader
                ? 'hidden'
                : 'hidden size-4 shrink-0 group-data-[collapsible=icon]:block'
            }
          />
          <div
            className={
              inHeader
                ? 'grid flex-1 text-left text-sm leading-tight'
                : 'grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'
            }
          >
            <span
              className={
                inHeader
                  ? 'max-w-[120px] truncate font-medium'
                  : 'truncate font-semibold'
              }
            >
              {currentTeam?.name ?? 'Select team'}
            </span>
          </div>
          <ChevronsUpDown
            className={
              inHeader
                ? 'size-4 opacity-50'
                : 'ml-auto group-data-[collapsible=icon]:hidden'
            }
          />
        </UiButton>
      </UiDropdownMenuTrigger>

      <UiDropdownMenuContent
        className={
          inHeader
            ? 'w-56'
            : 'w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
        }
        side={inHeader ? undefined : isMobile ? 'bottom' : 'right'}
        align={inHeader ? 'end' : 'start'}
        sideOffset={inHeader ? undefined : 4}
      >
        <UiDropdownMenuLabel className="text-xs text-muted-foreground">
          Teams
        </UiDropdownMenuLabel>
        {teams.map((team) => (
          <UiDropdownMenuItem
            key={team.id}
            data-test="team-switcher-item"
            className={teamItemClass}
            onClick={() => switchTeam(team)}
          >
            {team.name}
            {currentTeam?.id === team.id && (
              <Check
                className={cn(inHeader ? 'ml-auto size-4' : 'ml-auto h-4 w-4')}
              />
            )}
          </UiDropdownMenuItem>
        ))}
        <UiDropdownMenuSeparator />
        <CreateTeamModal>
          <UiDropdownMenuItem
            className={teamItemClass}
            onSelect={(event) => event.preventDefault()}
          >
            <Plus className={inHeader ? 'size-4' : 'h-4 w-4'} />
            <span className="text-muted-foreground">New team</span>
          </UiDropdownMenuItem>
        </CreateTeamModal>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  )
}
