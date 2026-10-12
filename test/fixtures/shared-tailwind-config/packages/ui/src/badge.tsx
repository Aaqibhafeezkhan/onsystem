export function Badge(props: { variant?: "neutral" | "success" | "error"; children?: React.ReactNode }) {
  return (
    <span data-variant={props.variant} className="bg-bg-subtle text-content-default rounded px-2">
      {props.children}
    </span>
  );
}
