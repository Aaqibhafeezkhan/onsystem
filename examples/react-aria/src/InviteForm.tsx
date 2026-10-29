// What a coding agent wrote before it could see the design system.
// `npm run check` (or the check_ui tool) reports every problem below.
import { Button } from "./components/Button"
import { Checkbox } from "./components/Checkbox"
import { Switch } from "./components/Switch"
import { TextField } from "./components/TextField"

export function InviteForm({ sending }: { sending: boolean }) {
  return (
    <form className="grid gap-4 p-[18px]">
      <TextField label="Email" type="email" isRequired />
      <Checkbox checked>Send me a copy</Checkbox>
      <Switch disabled={sending}>Notify by email</Switch>
      <p className="text-gray-600">They get an email with a link.</p>
      <div className="flex gap-2">
        <button className="rounded-lg bg-blue-600 px-5 py-2 text-white">
          Invite
        </button>
        <Button variant="danger" onPress={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
