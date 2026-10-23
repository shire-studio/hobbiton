import { Fragment } from 'react'
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types'

type Props = {
  breadcrumbs: BreadcrumbItemType[]
}

export default function Breadcrumbs({ breadcrumbs }: Props) {
  return (
    <UiBreadcrumb>
      <UiBreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <Fragment key={index}>
            <UiBreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <UiBreadcrumbPage>{item.title}</UiBreadcrumbPage>
              ) : (
                <UiBreadcrumbLink asChild>
                  <Link href={item.href}>{item.title}</Link>
                </UiBreadcrumbLink>
              )}
            </UiBreadcrumbItem>
            {index !== breadcrumbs.length - 1 && <UiBreadcrumbSeparator />}
          </Fragment>
        ))}
      </UiBreadcrumbList>
    </UiBreadcrumb>
  )
}
