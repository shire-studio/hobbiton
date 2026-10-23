import type { User } from '@/types'

type Props = {
  user: User
  showEmail?: boolean
}

export default function UserInfo({ user, showEmail = false }: Props) {
  const initials = getInitials(user.name)

  return (
    <div className="flex flex-1 items-center gap-2">
      <UiAvatar className="h-8 w-8 overflow-hidden rounded-lg">
        <UiAvatarFallback className="rounded-lg text-black dark:text-white">
          {initials}
        </UiAvatarFallback>
      </UiAvatar>

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
