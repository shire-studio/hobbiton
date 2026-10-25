import { BookOpen, FolderGit2, LayoutGrid } from '@lucide/vue'
import { dashboard } from '@/routes/team'
import type { NavItem } from '@/types'

export const mainNavItems = (teamSlug?: string): NavItem[] => [
  {
    title: 'Dashboard',
    href: teamSlug ? dashboard(teamSlug) : '/',
    icon: LayoutGrid,
  },
]

export const extraNavItems: NavItem[] = [
  {
    title: 'Repository',
    href: 'https://github.com/shire-studio/laravel-starter-kit-vue',
    icon: FolderGit2,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits#vue',
    icon: BookOpen,
  },
]
