// Reka Select (USelect) forbids an option whose value is an empty string —
// empty string is reserved for "no selection / show placeholder". So the
// "— none —" option uses this sentinel, converted to/from null at the edges.
export const NONE = '__none__'

export function toNullable(value: string): string | null {
  return value === NONE || value === '' ? null : value
}

export function fromNullable(value: string | null | undefined): string {
  return value ?? NONE
}
