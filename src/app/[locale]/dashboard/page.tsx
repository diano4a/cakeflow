import { getTranslations } from "next-intl/server";

import { SpecList, SpecRow } from "@/components/ui/spec-row";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/auth/dal";

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations("Dashboard");

  return (
    <main className="flex flex-1 flex-col px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="divider-b flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="type-heading">{t("title")}</h1>
          <SignOutButton />
        </header>

        <SpecList className="mt-8">
          <SpecRow label={t("accountLabel")} data>
            {user.email}
          </SpecRow>
        </SpecList>

        <p className="type-body text-muted measure mt-8">{t("placeholder")}</p>
      </div>
    </main>
  );
}
