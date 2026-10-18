import { Form, Head } from '@inertiajs/react'
import DeleteUser from '@/components/DeleteUser'
import Heading from '@/components/Heading'
import InputError from '@/components/InputError'
import TextLink from '@/components/TextLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppLayout from '@/layouts/AppLayout'
import SettingsLayout from '@/layouts/settings/Layout'
import { edit, update } from '@/routes/user-profile'
import { send } from '@/routes/verification'
import type { BreadcrumbItem } from '@/types'

const breadcrumbItems: BreadcrumbItem[] = [
  {
    title: 'Profile settings',
    href: edit(),
  },
]

type Props = {
  status: string | null
}

export default function Profile({ status }: Props) {
  const user = usePage().props.auth.user!
  const verificationLinkSent =
    status === ('verification-link-sent' satisfies App.Enums.SessionStatus)

  return (
    <AppLayout breadcrumbs={breadcrumbItems}>
      <Head title="Profile settings" />

      <h1 className="sr-only">Profile settings</h1>

      <SettingsLayout>
        <div className="flex flex-col space-y-6">
          <Heading
            variant="small"
            title="Profile"
            description="Update your name and email address"
          />

          <Form {...update.form()} className="space-y-6">
            {({ errors, processing, validate }) => (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    className="mt-1 block w-full"
                    name="name"
                    defaultValue={user.name}
                    required
                    autoComplete="name"
                    placeholder="Full name"
                    onBlur={() => validate('name')}
                  />
                  <InputError className="mt-2" message={errors.name} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    className="mt-1 block w-full"
                    name="email"
                    defaultValue={user.email}
                    required
                    autoComplete="username"
                    placeholder="Email address"
                    onBlur={() => validate('email')}
                  />
                  <InputError className="mt-2" message={errors.email} />
                </div>

                {!user.email_verified_at && (
                  <div>
                    <p className="-mt-4 text-sm text-muted-foreground">
                      Your email address is unverified.{' '}
                      <TextLink href={send()} as="button">
                        Click here to re-send the verification email.
                      </TextLink>
                    </p>

                    {verificationLinkSent && (
                      <div className="mt-2 text-sm font-medium text-green-600">
                        A new verification link has been sent to your email
                        address.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button
                    disabled={processing}
                    data-test="update-profile-button"
                  >
                    Save
                  </Button>
                </div>
              </>
            )}
          </Form>
        </div>

        <DeleteUser />
      </SettingsLayout>
    </AppLayout>
  )
}
