import { toUrl } from '@/lib/utils'
import type { NavItem } from '@/types'

type Props = {
  items: NavItem[]
}

export default function NavFooter({ items }: Props) {
  return (
    <UiSidebarGroup className="group-data-[collapsible=icon]:p-0">
      <UiSidebarGroupContent>
        <UiSidebarMenu>
          {items.map((item) => (
            <UiSidebarMenuItem key={item.title}>
              <UiSidebarMenuButton
                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
                asChild
              >
                <a
                  href={toUrl(item.href)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </UiSidebarMenuButton>
            </UiSidebarMenuItem>
          ))}
        </UiSidebarMenu>
      </UiSidebarGroupContent>
    </UiSidebarGroup>
  )
}
