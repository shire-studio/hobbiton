import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { toUrl } from '@/lib/utils'
import type { NavItem } from '@/types'

type Props = {
  items: NavItem[]
}

export default function NavFooter({ items }: Props) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:p-0">
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
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
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
