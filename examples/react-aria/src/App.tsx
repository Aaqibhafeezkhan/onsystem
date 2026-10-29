// UI written against the design system: check reports nothing.
import { DialogTrigger } from "react-aria-components"

import { Button } from "./components/Button"
import { Checkbox } from "./components/Checkbox"
import { Dialog, DialogTitle } from "./components/Dialog"
import { Modal } from "./components/Modal"
import { Switch } from "./components/Switch"
import { TextField } from "./components/TextField"

export function App() {
  return (
    <form className="mx-auto grid max-w-md gap-4 p-6">
      <h1 className="text-xl font-semibold">New project</h1>
      <TextField label="Name" isRequired placeholder="Acme website" />
      <Checkbox defaultSelected>Invite my team</Checkbox>
      <Switch>Private</Switch>
      <div className="flex justify-end gap-2">
        <DialogTrigger>
          <Button variant="quiet">Discard</Button>
          <Modal>
            <Dialog role="alertdialog">
              {({ close }) => (
                <>
                  <DialogTitle>Discard this project?</DialogTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nothing has been saved yet.
                  </p>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button variant="secondary" onPress={close}>
                      Keep editing
                    </Button>
                    <Button variant="destructive" onPress={close}>
                      Discard
                    </Button>
                  </div>
                </>
              )}
            </Dialog>
          </Modal>
        </DialogTrigger>
        <Button type="submit">Create project</Button>
      </div>
    </form>
  )
}
