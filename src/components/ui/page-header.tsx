type PageHeaderProps = {
  /** Already-localized title. */
  title: string;
  /** Already-localized supporting line. Omitted when the page has no subtitle. */
  description?: string;
};

/**
 * Title and description as one header group: a tight cluster gap between
 * them, so the following section gap can sit on the group rather than on
 * the heading alone.
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-cluster">
      <h1 className="type-heading">{title}</h1>
      {description ? (
        <p className="type-body text-muted measure">{description}</p>
      ) : null}
    </header>
  );
}
