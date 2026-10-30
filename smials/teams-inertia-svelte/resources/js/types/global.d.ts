import type { Auth } from '@/types/auth'

declare module '@inertiajs/core' {
  export interface InertiaConfig {
    sharedPageProps: {
      name: string
      auth: Auth
      currentTeam: App.Data.TeamData | null
      teams: App.Data.TeamData[]
      sidebarOpen: boolean
      [key: string]: unknown
    }
  }
}
