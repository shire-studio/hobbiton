<script lang="ts">
  import { usePasskeyRegister } from '@laravel/passkeys/svelte'
  import {
    index as registerOptions,
    store as registerStore,
  } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController'

  let { onSuccess }: { onSuccess: () => void } = $props()

  const getDefaultPasskeyName = (): string => {
    const ua = navigator.userAgent

    const browser = [
      { pattern: /Edg|Edge/, name: 'Edge' },
      { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
      { pattern: /Firefox|FxiOS/, name: 'Firefox' },
      { pattern: /Chrome|CriOS/, name: 'Chrome' },
      { pattern: /Safari/, name: 'Safari' },
    ].find(({ pattern }) => pattern.test(ua))?.name

    const os = [
      { pattern: /iPhone/, name: 'iPhone' },
      { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
      { pattern: /Android/, name: 'Android' },
      { pattern: /Mac/, name: 'Mac' },
      { pattern: /Windows/, name: 'Windows' },
    ].find(({ pattern }) => pattern.test(ua))?.name

    return [browser, os].filter(Boolean).join(' on ') || ''
  }

  let name = $state<string>(getDefaultPasskeyName())
  let showForm = $state<boolean>(false)

  const passkeyRegister = usePasskeyRegister({
    routes: {
      options: registerOptions.url(),
      submit: registerStore.url(),
    },
    onSuccess: () => {
      name = ''
      showForm = false
      onSuccess()
    },
  })

  const handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault()

    if (!name.trim()) {
      return
    }

    await passkeyRegister.register(name)
  }

  const handleCancel = (): void => {
    showForm = false
    name = ''
  }
</script>

<div>
  {#if !passkeyRegister.isSupported}
    <div class="text-sm text-muted-foreground">
      Passkeys are not supported in this browser.
    </div>
  {:else if !showForm}
    <UiButton variant="outline" onclick={() => (showForm = true)}>
      Add passkey
    </UiButton>
  {:else}
    <form
      onsubmit={handleSubmit}
      class="space-y-4 rounded-lg border border-border bg-muted/50 p-4"
    >
      <div class="grid gap-2">
        <UiLabel for="passkey-name">Passkey name</UiLabel>
        <UiInput
          id="passkey-name"
          type="text"
          bind:value={name}
          placeholder="e.g., MacBook Pro, iPhone"
          class="mt-1 block w-full border-foreground/20"
          autofocus
        />
        <p class="text-xs text-muted-foreground">
          A name helps you identify this passkey later.
        </p>
      </div>

      {#if passkeyRegister.error}
        <InputError message={passkeyRegister.error} />
      {/if}

      <div class="flex gap-2">
        <UiButton
          type="submit"
          disabled={passkeyRegister.isLoading || !name.trim()}
        >
          {passkeyRegister.isLoading ? 'Registering...' : 'Register passkey'}
        </UiButton>
        <UiButton type="button" variant="ghost" onclick={handleCancel}>
          Cancel
        </UiButton>
      </div>
    </form>
  {/if}
</div>
