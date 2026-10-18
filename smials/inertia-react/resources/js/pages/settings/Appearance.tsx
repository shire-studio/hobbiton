import { Head } from '@inertiajs/react'
import AppearanceTabs from '@/components/AppearanceTabs'
import Heading from '@/components/Heading'
import AppLayout from '@/layouts/AppLayout'
import SettingsLayout from '@/layouts/settings/Layout'
import { edit } from '@/routes/appearance'
import type { BreadcrumbItem } from '@/types'

const breadcrumbItems: BreadcrumbItem[] = [
  {
    title: 'Appearance settings',
    href: edit(),
  },
]

export default function Appearance() {
  return (
    <AppLayout breadcrumbs={breadcrumbItems}>
      <Head title="Appearance settings" />

      <h1 className="sr-only">Appearance settings</h1>

      <SettingsLayout>
        <div className="space-y-6">
          <Heading
            variant="small"
            title="Appearance settings"
            description="Update the appearance settings for your account"
          />
          <AppearanceTabs />
        </div>
      </SettingsLayout>
    </AppLayout>
  )
}
