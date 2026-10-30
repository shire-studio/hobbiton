import { destroy } from '@/routes/teams'

type Props = {
  team: App.Data.TeamData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DeleteTeamModal({ team, open, onOpenChange }: Props) {
  const [confirmationName, setConfirmationName] = useState('')
  const [formKey, setFormKey] = useState(0)

  const canDeleteTeam = confirmationName === team.name

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setConfirmationName('')
      setFormKey((key) => key + 1)
    }
  }

  return (
    <UiDialog open={open} onOpenChange={handleOpenChange}>
      <UiDialogContent>
        <Form
          key={formKey}
          {...destroy.form(team.slug)}
          className="space-y-6"
          onSuccess={() => handleOpenChange(false)}
        >
          {({ errors, processing }) => (
            <>
              <UiDialogHeader>
                <UiDialogTitle>Are you sure?</UiDialogTitle>
                <UiDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  team <strong>"{team.name}"</strong>.
                </UiDialogDescription>
              </UiDialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <UiLabel htmlFor="confirmation-name">
                    Type <strong>"{team.name}"</strong> to confirm
                  </UiLabel>
                  <UiInput
                    id="confirmation-name"
                    name="name"
                    data-test="delete-team-name"
                    value={confirmationName}
                    onChange={(event) =>
                      setConfirmationName(event.target.value)
                    }
                    placeholder="Enter team name"
                    autoComplete="off"
                  />
                  <InputError message={errors.name} />
                </div>
              </div>

              <UiDialogFooter className="gap-2">
                <UiDialogClose asChild>
                  <UiButton variant="secondary">Cancel</UiButton>
                </UiDialogClose>

                <UiButton
                  data-test="delete-team-submit"
                  variant="destructive"
                  type="submit"
                  disabled={!canDeleteTeam || processing}
                >
                  Delete team
                </UiButton>
              </UiDialogFooter>
            </>
          )}
        </Form>
      </UiDialogContent>
    </UiDialog>
  )
}
