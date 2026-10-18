import { Link } from '@inertiajs/react'
import { LogOut, Settings } from 'lucide-react'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import UserInfo from '@/components/UserInfo'
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
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserInfo user={user} showEmail={true} />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link className="block w-full cursor-pointer" href={edit()} prefetch>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
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
      </DropdownMenuItem>
    </>
  )
}
