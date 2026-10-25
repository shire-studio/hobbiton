<script setup lang="ts">
import { extraNavItems, mainNavItems } from '@/lib/navigation'
import { dashboard } from '@/routes/team'

const page = usePage()
const teamSlug = computed(() => page.props.currentTeam?.slug)
const dashboardUrl = computed(() =>
  teamSlug.value ? dashboard(teamSlug.value).url : '/',
)
</script>

<template>
  <UiSidebar collapsible="icon" variant="inset">
    <UiSidebarHeader>
      <UiSidebarMenu>
        <UiSidebarMenuItem>
          <UiSidebarMenuButton size="lg" as-child>
            <Link :href="dashboardUrl">
              <AppLogo />
            </Link>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
      <UiSidebarMenu>
        <UiSidebarMenuItem>
          <TeamSwitcher />
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarHeader>

    <UiSidebarContent>
      <NavMain :items="mainNavItems(teamSlug)" />
    </UiSidebarContent>

    <UiSidebarFooter>
      <NavFooter :items="extraNavItems" />
      <NavUser />
    </UiSidebarFooter>
  </UiSidebar>
</template>
