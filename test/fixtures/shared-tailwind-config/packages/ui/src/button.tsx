export function Button(props: { variant?: "primary" | "secondary"; children?: React.ReactNode }) {
  return (
    <button
      data-variant={props.variant}
      className="border-border-default bg-bg-default text-content-emphasis rounded-md border px-3"
    >
      {props.children}
    </button>
  );
}
