import { Button, Input } from "@acme/ui";

export default function Page({ error }: { error?: string }) {
  return (
    <form className="bg-bg-default">
      <Input />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button>Save</Button>
    </form>
  );
}
