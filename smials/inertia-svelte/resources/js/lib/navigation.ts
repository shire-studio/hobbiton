import { BookOpen, FolderGit2, LayoutGrid } from '@lucide/svelte'
import { dashboard } from '@/routes'
import type { NavItem } from '@/types'

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutGrid,
  },
]

export const extraNavItems: NavItem[] = [
  {
    title: 'Repository',
    href: 'https://github.com/shire-studio/laravel-starter-kit-svelte',
    icon: FolderGit2,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits#svelte',
    icon: BookOpen,
  },
]
