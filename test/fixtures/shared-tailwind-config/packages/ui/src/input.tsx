export function Input(props: { error?: string }) {
  return (
    <div>
      <input className="border-border-default text-content-default rounded-md border" />
      {props.error && <p className="text-content-error text-sm">{props.error}</p>}
    </div>
  );
}
