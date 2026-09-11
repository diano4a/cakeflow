import { getTranslations } from "next-intl/server";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/auth/dal";

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("Dashboard");

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 sm:p-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("signedInAs", { email: user.email })}
          </p>
        </div>
        <SignOutButton />
      </header>

      <p className="text-muted-foreground">{t("placeholder")}</p>
    </main>
  );
}
