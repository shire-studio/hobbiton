import type { ReactNode } from 'react'
import { store } from '@/routes/teams'

type Props = {
  children: ReactNode
}

export default function CreateTeamModal({ children }: Props) {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const handleOpenChange = (value: boolean) => {
    setOpen(value)

    if (!value) {
      setFormKey((key) => key + 1)
    }
  }

  return (
    <UiDialog open={open} onOpenChange={handleOpenChange}>
      <UiDialogTrigger asChild>{children}</UiDialogTrigger>
      <UiDialogContent>
        <Form
          key={formKey}
          {...store.form()}
          className="space-y-6"
          onSuccess={() => setOpen(false)}
        >
          {({ errors, processing }) => (
            <>
              <UiDialogHeader>
                <UiDialogTitle>Create a new team</UiDialogTitle>
                <UiDialogDescription>
                  Create a new team to collaborate with others.
                </UiDialogDescription>
              </UiDialogHeader>

              <div className="grid gap-2">
                <UiLabel htmlFor="create-team-name">Team name</UiLabel>
                <UiInput
                  id="create-team-name"
                  name="name"
                  data-test="create-team-name"
                  placeholder="My team"
                  required
                />
                <InputError message={errors.name} />
              </div>

              <UiDialogFooter className="gap-2">
                <UiDialogClose asChild>
                  <UiButton variant="secondary">Cancel</UiButton>
                </UiDialogClose>

                <UiButton
                  type="submit"
                  data-test="create-team-submit"
                  disabled={processing}
                >
                  Create team
                </UiButton>
              </UiDialogFooter>
            </>
          )}
        </Form>
      </UiDialogContent>
    </UiDialog>
  )
}
