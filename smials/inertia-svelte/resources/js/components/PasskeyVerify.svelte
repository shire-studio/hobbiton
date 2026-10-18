<script lang="ts">
  import type { UrlMethodPair } from '@inertiajs/core'
  import { usePasskeyVerify } from '@laravel/passkeys/svelte'
  import { KeyRound } from '@lucide/svelte'
  import InputError from '@/components/InputError.svelte'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import { Spinner } from '@/components/ui/spinner'

  type Props = {
    routes: {
      options: UrlMethodPair
      submit: UrlMethodPair
    }
    label?: string
    loadingLabel?: string
    separator?: string
  }

  let props: Props = $props()

  const passkeyVerify = usePasskeyVerify({
    routes: untrack(() => ({
      options: props.routes.options.url,
      submit: props.routes.submit.url,
    })),
    onSuccess: (response) => {
      router.visit(response.redirect ?? '/')
    },
  })
</script>

{#if passkeyVerify.isSupported}
  <div>
    <div class="grid gap-2">
      <Button
        type="button"
        variant="outline"
        class="w-full"
        onclick={passkeyVerify.verify}
        disabled={passkeyVerify.isLoading}
      >
        {#if passkeyVerify.isLoading}
          <Spinner />
        {:else}
          <KeyRound class="h-4 w-4" />
        {/if}
        {passkeyVerify.isLoading
          ? (props.loadingLabel ?? 'Authenticating...')
          : (props.label ?? 'Sign in with a passkey')}
      </Button>

      {#if passkeyVerify.error}
        <div class="text-center">
          <InputError message={passkeyVerify.error} />
        </div>
      {/if}
    </div>

    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <Separator class="w-full" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-background px-2 text-muted-foreground">
          {props.separator ?? 'Or continue with email'}
        </span>
      </div>
    </div>
  </div>
{/if}
