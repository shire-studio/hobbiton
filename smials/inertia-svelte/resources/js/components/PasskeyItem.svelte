<script lang="ts">
  import { KeyRound, Trash2 } from '@lucide/svelte'

  let {
    passkey,
    onRemove,
  }: {
    passkey: App.Data.PasskeyData
    onRemove: (id: string, onError: () => void) => void
  } = $props()

  let isDeleting = $state(false)

  const handleDelete = () => {
    isDeleting = true
    onRemove(passkey.id, () => {
      isDeleting = false
    })
  }
</script>

<div class="flex items-center justify-between border-b p-4 last:border-b-0">
  <div class="flex items-center gap-4">
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"
    >
      <KeyRound class="h-5 w-5 text-muted-foreground" />
    </div>
    <div class="space-y-1">
      <div class="flex items-center gap-2.5">
        <p class="font-medium tracking-tight">{passkey.name}</p>
        {#if passkey.authenticator}
          <span
            class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase ring-1 ring-border ring-inset"
          >
            {passkey.authenticator}
          </span>
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">
        Added {passkey.created_at_diff}
        {#if passkey.last_used_at_diff}
          <span class="mx-1 text-muted-foreground/50">/</span>
          Last used {passkey.last_used_at_diff}
        {/if}
      </p>
    </div>
  </div>

  <UiDialog>
    <UiDialogTrigger asChild>
      {#snippet children(props)}
        <UiButton
          variant="ghost"
          size="sm"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onclick={props.onClick}
        >
          <Trash2 class="h-4 w-4" />
          <span class="sr-only">Remove</span>
        </UiButton>
      {/snippet}
    </UiDialogTrigger>

    <UiDialogContent>
      <UiDialogTitle>Remove passkey</UiDialogTitle>
      <UiDialogDescription>
        Are you sure you want to remove the "{passkey.name}" passkey? You will
        no longer be able to use it to sign in.
      </UiDialogDescription>
      <UiDialogFooter class="gap-2">
        <UiDialogClose asChild>
          {#snippet children(props)}
            <UiButton variant="secondary" onclick={props.onClick}
              >Cancel</UiButton
            >
          {/snippet}
        </UiDialogClose>
        <UiButton
          variant="destructive"
          disabled={isDeleting}
          onclick={handleDelete}
        >
          {isDeleting ? 'Removing...' : 'Remove passkey'}
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</div>
