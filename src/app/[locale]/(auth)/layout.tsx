export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <main className="flex flex-1 items-start justify-center px-5 py-12 sm:items-center sm:px-8">
      <div className="bg-paper hairline-y w-full max-w-sm px-5 py-8 sm:px-8">
        {children}
      </div>
    </main>
  );
}
