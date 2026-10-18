<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import { LogOut, Settings } from '@lucide/svelte'
  import UserInfo from '@/components/UserInfo.svelte'
  import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
  } from '@/components/ui/dropdown-menu'
  import { logout } from '@/routes'
  import { edit } from '@/routes/user-profile'
  import type { User } from '@/types'

  let { user }: { user: User } = $props()

  const handleLogout = (onClick?: () => void) => () => {
    onClick?.()
    router.flushAll()
  }
</script>

<DropdownMenuLabel class="p-0 font-normal">
  <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
    <UserInfo {user} showEmail={true} />
  </div>
</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuGroup>
  <DropdownMenuItem asChild>
    {#snippet children(props)}
      <Link
        class="{props.class} block w-full cursor-pointer"
        href={edit()}
        prefetch
        onclick={props.onClick}
      >
        <Settings class="mr-2 h-4 w-4" />
        Settings
      </Link>
    {/snippet}
  </DropdownMenuItem>
</DropdownMenuGroup>
<DropdownMenuSeparator />
<DropdownMenuItem asChild>
  {#snippet children(props)}
    <Link
      class="{props.class} block w-full cursor-pointer"
      href={logout()}
      onclick={handleLogout(props.onClick)}
      as="button"
      data-test="logout-button"
    >
      <LogOut class="mr-2 h-4 w-4" />
      Log out
    </Link>
  {/snippet}
</DropdownMenuItem>
