import type { ReactNode } from 'react'
import AuthSimpleLayout from '@/layouts/auth/AuthSimpleLayout'

type Props = {
  title?: string
  description?: string
  children: ReactNode
}

export default function AuthLayout({ title, description, children }: Props) {
  return (
    <AuthSimpleLayout title={title} description={description}>
      {children}
    </AuthSimpleLayout>
  )
}
