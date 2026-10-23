<script lang="ts">
  import { edit, update } from '@/routes/user-profile'
  import { send } from '@/routes/verification'
  import type { BreadcrumbItem } from '@/types'

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      title: 'Profile settings',
      href: edit(),
    },
  ]

  let { status }: { status: string | null } = $props()

  const user = $derived(page.props.auth.user!)
  const verificationLinkSent = $derived(
    status === ('verification-link-sent' satisfies App.Enums.SessionStatus),
  )
</script>

<AppLayout breadcrumbs={breadcrumbItems}>
  <AppHead title="Profile settings" />

  <h1 class="sr-only">Profile settings</h1>

  <SettingsLayout>
    <div class="flex flex-col space-y-6">
      <Heading
        variant="small"
        title="Profile"
        description="Update your name and email address"
      />

      <Form {...update.form()} class="space-y-6">
        {#snippet children({ errors, processing, validate })}
          <div class="grid gap-2">
            <UiLabel for="name">Name</UiLabel>
            <UiInput
              id="name"
              class="mt-1 block w-full"
              name="name"
              value={user.name}
              required
              autocomplete="name"
              placeholder="Full name"
              onchange={() => validate('name')}
            />
            <InputError class="mt-2" message={errors.name} />
          </div>

          <div class="grid gap-2">
            <UiLabel for="email">Email address</UiLabel>
            <UiInput
              id="email"
              type="email"
              class="mt-1 block w-full"
              name="email"
              value={user.email}
              required
              autocomplete="username"
              placeholder="Email address"
              onchange={() => validate('email')}
            />
            <InputError class="mt-2" message={errors.email} />
          </div>

          {#if !user.email_verified_at}
            <div>
              <p class="-mt-4 text-sm text-muted-foreground">
                Your email address is unverified.
                <TextLink href={send()} as="button">
                  Click here to re-send the verification email.
                </TextLink>
              </p>

              {#if verificationLinkSent}
                <div class="mt-2 text-sm font-medium text-green-600">
                  A new verification link has been sent to your email address.
                </div>
              {/if}
            </div>
          {/if}

          <div class="flex items-center gap-4">
            <UiButton
              type="submit"
              disabled={processing}
              data-test="update-profile-button">Save</UiButton
            >
          </div>
        {/snippet}
      </Form>
    </div>

    <DeleteUser />
  </SettingsLayout>
</AppLayout>
