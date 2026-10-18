import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { User } from '@/types'

type Props = {
  user: User
  showEmail?: boolean
}

export default function UserInfo({ user, showEmail = false }: Props) {
  const initials = getInitials(user.name)

  return (
    <div className="flex flex-1 items-center gap-2">
      <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
        <AvatarFallback className="rounded-lg text-black dark:text-white">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && (
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        )}
      </div>
    </div>
  )
}
