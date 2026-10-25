import type { NavItem } from '@/types'

type Props = {
  items: NavItem[]
}

export default function NavMain({ items }: Props) {
  const { isCurrentUrl } = useCurrentUrl()

  return (
    <UiSidebarGroup className="px-2 py-0">
      <UiSidebarGroupLabel>Platform</UiSidebarGroupLabel>
      <UiSidebarMenu>
        {items.map((item) => (
          <UiSidebarMenuItem key={item.title}>
            <UiSidebarMenuButton
              asChild
              isActive={isCurrentUrl(item.href)}
              tooltip={{ children: item.title }}
            >
              <Link
                href={item.href}
                data-test={`${item.title.toLowerCase()}-link`}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        ))}
      </UiSidebarMenu>
    </UiSidebarGroup>
  )
}
