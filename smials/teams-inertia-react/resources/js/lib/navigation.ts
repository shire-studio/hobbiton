import { BookOpen, FolderGit2, LayoutGrid } from 'lucide-react'
import { dashboard } from '@/routes'
import { dashboard as teamDashboard } from '@/routes/team'
import type { NavItem } from '@/types'

export const dashboardUrl = (teamSlug?: string) =>
  teamSlug ? teamDashboard(teamSlug) : dashboard()

export const mainNavItems = (teamSlug?: string): NavItem[] => [
  {
    title: 'Dashboard',
    href: dashboardUrl(teamSlug),
    icon: LayoutGrid,
  },
]

export const extraNavItems: NavItem[] = [
  {
    title: 'Repository',
    href: 'https://github.com/shire-studio/laravel-starter-kit-react',
    icon: FolderGit2,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits#react',
    icon: BookOpen,
  },
]
