import { destroy } from '@/routes/user'

export default function DeleteUser() {
  const passwordInput = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      <Heading
        variant="small"
        title="Delete account"
        description="Delete your account and all of its resources"
      />
      <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
        <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
          <p className="font-medium">Warning</p>
          <p className="text-sm">
            Please proceed with caution, this cannot be undone.
          </p>
        </div>
        <UiDialog>
          <UiDialogTrigger asChild>
            <UiButton variant="destructive" data-test="delete-user-button">
              Delete account
            </UiButton>
          </UiDialogTrigger>
          <UiDialogContent>
            <Form
              {...destroy.form()}
              resetOnSuccess
              onError={() => passwordInput.current?.focus()}
              options={{
                preserveScroll: true,
              }}
              className="space-y-6"
            >
              {({ errors, processing, reset, clearErrors, validate }) => (
                <>
                  <UiDialogHeader className="space-y-3">
                    <UiDialogTitle>
                      Are you sure you want to delete your account?
                    </UiDialogTitle>
                    <UiDialogDescription>
                      Once your account is deleted, all of its resources and
                      data will also be permanently deleted. Please enter your
                      password to confirm you would like to permanently delete
                      your account.
                    </UiDialogDescription>
                  </UiDialogHeader>

                  <div className="grid gap-2">
                    <UiLabel htmlFor="password" className="sr-only">
                      Password
                    </UiLabel>
                    <PasswordInput
                      id="password"
                      name="password"
                      ref={passwordInput}
                      placeholder="Password"
                      onBlur={() => validate('password')}
                    />
                    <InputError message={errors.password} />
                  </div>

                  <UiDialogFooter className="gap-2">
                    <UiDialogClose asChild>
                      <UiButton
                        variant="secondary"
                        onClick={() => {
                          clearErrors()
                          reset()
                        }}
                      >
                        Cancel
                      </UiButton>
                    </UiDialogClose>

                    <UiButton
                      type="submit"
                      variant="destructive"
                      disabled={processing}
                      data-test="confirm-delete-user-button"
                    >
                      Delete account
                    </UiButton>
                  </UiDialogFooter>
                </>
              )}
            </Form>
          </UiDialogContent>
        </UiDialog>
      </div>
    </div>
  )
}
