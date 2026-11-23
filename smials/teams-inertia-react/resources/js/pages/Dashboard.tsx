import { dashboardUrl } from '@/lib/navigation'
import type { BreadcrumbItem } from '@/types'

type Props = {
  pendingInvitations: App.Data.PendingTeamInvitationData[]
}

export default function Dashboard({ pendingInvitations }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: dashboardUrl(usePage().props.currentTeam?.slug),
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      {pendingInvitations.length > 0 && (
        <PendingInvitationsModal invitations={pendingInvitations} />
      )}
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern />
          </div>
        </div>
        <div className="relative min-h-[100vh] flex-1 rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <PlaceholderPattern />
        </div>
      </div>
    </AppLayout>
  )
}
