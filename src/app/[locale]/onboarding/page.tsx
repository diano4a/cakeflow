import { getLocale, getTranslations } from "next-intl/server";

import { CreateBakeryForm } from "@/features/bakery/components/create-bakery-form";
import { requireOnboarding } from "@/features/bakery/dal";
import { requireUser } from "@/lib/auth/dal";

export default async function OnboardingPage() {
  const locale = await getLocale();
  await requireUser(locale);
  await requireOnboarding(locale);
  const t = await getTranslations("Onboarding");

  return (
    <main className="flex flex-1 items-start justify-center px-5 py-12 sm:items-center sm:px-8">
      <div className="bg-paper hairline-y w-full max-w-sm px-5 py-8 sm:px-8">
        <div className="grid gap-8">
          <header className="grid gap-2">
            <h1 className="type-heading">{t("title")}</h1>
            <p className="type-body text-muted measure">{t("subtitle")}</p>
          </header>
          <CreateBakeryForm />
        </div>
      </div>
    </main>
  );
}
