<script lang="ts">
  import { dashboardUrl } from '@/lib/navigation'
  import type { BreadcrumbItem } from '@/types'

  let {
    pendingInvitations,
  }: {
    pendingInvitations: App.Data.PendingTeamInvitationData[]
  } = $props()

  const breadcrumbs: BreadcrumbItem[] = $derived([
    {
      title: 'Dashboard',
      href: dashboardUrl(page.props.currentTeam?.slug),
    },
  ])
</script>

<AppLayout {breadcrumbs}>
  <AppHead title="Dashboard" />

  {#if pendingInvitations.length > 0}
    <PendingInvitationsModal invitations={pendingInvitations} />
  {/if}
  <div class="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div
        class="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
      >
        <PlaceholderPattern />
      </div>
      <div
        class="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
      >
        <PlaceholderPattern />
      </div>
      <div
        class="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
      >
        <PlaceholderPattern />
      </div>
    </div>
    <div
      class="relative min-h-[100vh] flex-1 rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border"
    >
      <PlaceholderPattern />
    </div>
  </div>
</AppLayout>
