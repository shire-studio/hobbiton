<script lang="ts">
  import AppHead from '@/components/AppHead.svelte'
  import AppearanceTabs from '@/components/AppearanceTabs.svelte'
  import Heading from '@/components/Heading.svelte'
  import AppLayout from '@/layouts/AppLayout.svelte'
  import SettingsLayout from '@/layouts/settings/Layout.svelte'
  import { edit } from '@/routes/appearance'
  import type { BreadcrumbItem } from '@/types'

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      title: 'Appearance settings',
      href: edit(),
    },
  ]
</script>

<AppLayout breadcrumbs={breadcrumbItems}>
  <AppHead title="Appearance settings" />

  <h1 class="sr-only">Appearance settings</h1>

  <SettingsLayout>
    <div class="space-y-6">
      <Heading
        variant="small"
        title="Appearance settings"
        description="Update the appearance settings for your account"
      />
      <AppearanceTabs />
    </div>
  </SettingsLayout>
</AppLayout>
