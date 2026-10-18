import { Link } from '@inertiajs/react'
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types'

type Props = {
  breadcrumbs: BreadcrumbItemType[]
}

export default function Breadcrumbs({ breadcrumbs }: Props) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index !== breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
