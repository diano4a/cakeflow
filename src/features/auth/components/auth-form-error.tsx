/**
 * Errors are monochrome: weight and a strong ink rule carry the emphasis,
 * since the design system has no status colors.
 */
export function AuthFormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="type-body text-ink border-l-2 border-ink pl-3 font-medium"
    >
      {message}
    </p>
  );
}
