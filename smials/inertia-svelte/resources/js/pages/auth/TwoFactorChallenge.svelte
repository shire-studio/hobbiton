<script lang="ts">
  import { store } from '@/routes/two-factor/login'
  import type { TwoFactorConfigContent } from '@/types'

  let showRecoveryInput = $state<boolean>(false)
  let code = $state<string>('')

  const authConfigContent = $derived.by<TwoFactorConfigContent>(() => {
    if (showRecoveryInput) {
      return {
        title: 'Recovery code',
        description:
          'Please confirm access to your account by entering one of your emergency recovery codes.',
        buttonText: 'login using an authentication code',
      }
    }

    return {
      title: 'Authentication code',
      description:
        'Enter the authentication code provided by your authenticator application.',
      buttonText: 'login using a recovery code',
    }
  })

  const toggleRecoveryMode = (clearErrors: () => void): void => {
    showRecoveryInput = !showRecoveryInput
    clearErrors()
    code = ''
  }
</script>

<AuthLayout
  title={authConfigContent.title}
  description={authConfigContent.description}
>
  <AppHead title="Two-factor authentication" />

  <div class="space-y-6">
    <Form
      {...store.form()}
      class="space-y-4"
      resetOnError
      onError={() => (code = '')}
    >
      {#snippet children({ errors, processing, clearErrors })}
        {#if !showRecoveryInput}
          <div
            class="flex flex-col items-center justify-center space-y-3 text-center"
          >
            <input type="hidden" name="code" value={code} />
            <div class="flex w-full items-center justify-center">
              <UiInputOTP
                id="otp"
                bind:value={code}
                maxlength={6}
                disabled={processing}
                autofocus
              >
                <UiInputOTPGroup>
                  {#each { length: 6 } as _, index (index)}
                    <UiInputOTPSlot {index} />
                  {/each}
                </UiInputOTPGroup>
              </UiInputOTP>
            </div>
            <InputError message={errors.code} />
          </div>
        {:else}
          <UiInput
            name="recovery_code"
            type="text"
            placeholder="Enter recovery code"
            autofocus
            required
          />
          <InputError message={errors.recovery_code} />
        {/if}

        <UiButton type="submit" class="w-full" disabled={processing}
          >Continue</UiButton
        >

        <div class="text-center text-sm text-muted-foreground">
          <span>or you can </span>
          <button
            type="button"
            class="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
            onclick={() => toggleRecoveryMode(clearErrors)}
          >
            {authConfigContent.buttonText}
          </button>
        </div>
      {/snippet}
    </Form>
  </div>
</AuthLayout>
