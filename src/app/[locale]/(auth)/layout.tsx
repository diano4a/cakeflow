import { LocaleSwitcher } from "@/i18n/locale-switcher";

export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-start px-5 py-12 sm:justify-center sm:px-8">
      <div className="bg-paper hairline-y w-full max-w-sm px-5 py-8 sm:px-8">
        {children}
      </div>
      <div className="mt-layout">
        <LocaleSwitcher />
      </div>
    </main>
  );
}
