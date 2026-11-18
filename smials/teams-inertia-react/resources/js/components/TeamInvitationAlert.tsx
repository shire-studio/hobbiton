import { Info } from 'lucide-react'

type Props = {
  invitation: App.Data.TeamInvitationContextData
  action: 'Log in' | 'Register'
}

export default function TeamInvitationAlert({ invitation, action }: Props) {
  return (
    <div data-test="team-invitation-alert">
      <UiAlert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-100 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400">
        <Info className="size-4" />
        <UiAlertDescription className="text-blue-900 dark:text-blue-100">
          {action} to join the "{invitation.team_name}" team.
        </UiAlertDescription>
      </UiAlert>
    </div>
  )
}
