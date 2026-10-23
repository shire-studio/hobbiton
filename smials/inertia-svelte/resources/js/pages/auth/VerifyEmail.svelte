<script lang="ts">
  import { logout } from '@/routes'
  import { send } from '@/routes/verification'

  let { status }: { status: string | null } = $props()

  const verificationLinkSent = $derived(
    status === ('verification-link-sent' satisfies App.Enums.SessionStatus),
  )
</script>

<AuthLayout
  title="Email verification"
  description="Please verify your email address by clicking on the link we just emailed to you."
>
  <AppHead title="Email verification" />

  {#if verificationLinkSent}
    <div class="mb-4 text-center text-sm font-medium text-green-600">
      A new verification link has been sent to the email address you provided
      during registration.
    </div>
  {/if}

  <Form {...send.form()} class="space-y-6 text-center">
    {#snippet children({ processing })}
      <UiButton type="submit" disabled={processing} variant="secondary">
        {#if processing}<UiSpinner />{/if}
        Resend verification email
      </UiButton>

      <TextLink href={logout()} as="button" class="mx-auto block text-sm">
        Log out
      </TextLink>
    {/snippet}
  </Form>
</AuthLayout>
