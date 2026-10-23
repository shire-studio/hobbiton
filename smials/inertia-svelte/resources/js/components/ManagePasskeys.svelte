<script lang="ts">
  import { KeyRound } from '@lucide/svelte'
  import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController'

  let {
    canManagePasskeys,
    passkeys,
  }: {
    canManagePasskeys: boolean
    passkeys: App.Data.PasskeyData[]
  } = $props()

  const handleDelete = (id: string, onError: () => void): void => {
    router.delete(destroy.url(id), {
      preserveScroll: true,
      onError,
    })
  }

  const handleRegisterSuccess = (): void => {
    router.reload()
  }
</script>

{#if canManagePasskeys}
  <div class="space-y-6">
    <Heading
      variant="small"
      title="Passkeys"
      description="Manage your passkeys for passwordless sign-in"
    />

    <div class="overflow-hidden rounded-lg border border-border">
      {#if passkeys.length}
        {#each passkeys as passkey (passkey.id)}
          <PasskeyItem {passkey} onRemove={handleDelete} />
        {/each}
      {:else}
        <div class="p-8 text-center">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"
          >
            <KeyRound class="h-7 w-7 text-muted-foreground" />
          </div>
          <p class="font-medium">No passkeys yet</p>
          <p class="mt-1 text-sm text-muted-foreground">
            Add a passkey to sign in without a password
          </p>
        </div>
      {/if}
    </div>

    <PasskeyRegister onSuccess={handleRegisterSuccess} />
  </div>
{/if}
