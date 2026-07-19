/**
 * The lookup form used by /search, /address, /block and /verify. Carries a
 * real <label> (visually hidden) so the input has an accessible name — a
 * placeholder alone is not one, and it disappears once the user types.
 */
export function SearchForm({
  name,
  label,
  placeholder,
  defaultValue,
  submitLabel = "Search",
  children,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  submitLabel?: string;
  children?: React.ReactNode;
}) {
  const id = `search-${name}`;
  return (
    <form method="get" className="mb-8 flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input
        id={id}
        type="text"
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3 font-mono text-[14px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)]"
      />
      {children}
      <button
        type="submit"
        className="btn-yellow rounded-xl px-6 py-3 font-mono text-[13px]"
      >
        {submitLabel}
      </button>
    </form>
  );
}
