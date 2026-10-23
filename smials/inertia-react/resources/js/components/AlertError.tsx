import { AlertCircle } from 'lucide-react'

type Props = {
  errors: string[]
  title?: string
}

export default function AlertError({
  errors,
  title = 'Something went wrong.',
}: Props) {
  const uniqueErrors = Array.from(new Set(errors))

  return (
    <UiAlert variant="destructive">
      <AlertCircle className="size-4" />
      <UiAlertTitle>{title}</UiAlertTitle>
      <UiAlertDescription>
        <ul className="list-inside list-disc text-sm">
          {uniqueErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </UiAlertDescription>
    </UiAlert>
  )
}
