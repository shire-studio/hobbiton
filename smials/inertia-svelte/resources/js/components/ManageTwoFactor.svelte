<script lang="ts">
  import { Form } from '@inertiajs/svelte'
  import { ShieldCheck } from '@lucide/svelte'
  import Heading from '@/components/Heading.svelte'
  import TwoFactorRecoveryCodes from '@/components/TwoFactorRecoveryCodes.svelte'
  import TwoFactorSetupModal from '@/components/TwoFactorSetupModal.svelte'
  import { Button } from '@/components/ui/button'
  import { disable, enable } from '@/routes/two-factor'

  let {
    canManageTwoFactor,
    requiresConfirmation,
    twoFactorEnabled,
  }: {
    canManageTwoFactor: boolean
    requiresConfirmation: boolean
    twoFactorEnabled: boolean
  } = $props()

  const { hasSetupData, clearTwoFactorAuthData } = useTwoFactorAuth()
  let showSetupModal = $state<boolean>(false)

  onDestroy(() => clearTwoFactorAuthData())
</script>

{#if canManageTwoFactor}
  <div class="space-y-6">
    <Heading
      variant="small"
      title="Two-factor authentication"
      description="Manage your two-factor authentication settings"
    />

    {#if !twoFactorEnabled}
      <div class="flex flex-col items-start justify-start space-y-4">
        <p class="text-sm text-muted-foreground">
          When you enable two-factor authentication, you will be prompted for a
          secure pin during login. This pin can be retrieved from a
          TOTP-supported application on your phone.
        </p>

        <div>
          {#if hasSetupData.value}
            <Button onclick={() => (showSetupModal = true)}>
              <ShieldCheck />Continue setup
            </Button>
          {:else}
            <Form {...enable.form()} onSuccess={() => (showSetupModal = true)}>
              {#snippet children({ processing })}
                <Button type="submit" disabled={processing}>Enable 2FA</Button>
              {/snippet}
            </Form>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-start justify-start space-y-4">
        <p class="text-sm text-muted-foreground">
          You will be prompted for a secure, random pin during login, which you
          can retrieve from the TOTP-supported application on your phone.
        </p>

        <div class="relative inline">
          <Form {...disable.form()}>
            {#snippet children({ processing })}
              <Button variant="destructive" type="submit" disabled={processing}>
                Disable 2FA
              </Button>
            {/snippet}
          </Form>
        </div>

        <TwoFactorRecoveryCodes />
      </div>
    {/if}

    <TwoFactorSetupModal
      bind:isOpen={showSetupModal}
      {requiresConfirmation}
      {twoFactorEnabled}
    />
  </div>
{/if}
