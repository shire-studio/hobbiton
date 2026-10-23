import { LogOut, Settings } from 'lucide-react'
import { logout } from '@/routes'
import { edit } from '@/routes/user-profile'
import type { User } from '@/types'

type Props = {
  user: User
}

export default function UserMenuContent({ user }: Props) {
  const handleLogout = () => {
    router.flushAll()
  }

  return (
    <>
      <UiDropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserInfo user={user} showEmail={true} />
        </div>
      </UiDropdownMenuLabel>
      <UiDropdownMenuSeparator />
      <UiDropdownMenuGroup>
        <UiDropdownMenuItem asChild>
          <Link className="block w-full cursor-pointer" href={edit()} prefetch>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </UiDropdownMenuItem>
      </UiDropdownMenuGroup>
      <UiDropdownMenuSeparator />
      <UiDropdownMenuItem asChild>
        <Link
          className="block w-full cursor-pointer"
          href={logout()}
          onClick={handleLogout}
          as="button"
          data-test="logout-button"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Link>
      </UiDropdownMenuItem>
    </>
  )
}
