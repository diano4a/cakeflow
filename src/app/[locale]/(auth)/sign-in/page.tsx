import { getTranslations } from "next-intl/server";

import { SignInForm } from "@/features/auth/components/sign-in-form";
import { Link } from "@/i18n/navigation";
import { SIGN_UP_PATH } from "@/lib/auth/routes";

export default async function SignInPage({
  searchParams,
}: PageProps<"/[locale]/sign-in">) {
  const [{ redirectTo }, t] = await Promise.all([
    searchParams,
    getTranslations("Auth"),
  ]);

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="type-heading">{t("signInTitle")}</h1>
        <p className="type-body text-muted measure">{t("signInSubtitle")}</p>
      </header>

      <SignInForm
        redirectTo={typeof redirectTo === "string" ? redirectTo : undefined}
      />

      <p className="type-body text-muted hairline-t pt-4">
        {t("signInNoAccount")}{" "}
        <Link
          href={SIGN_UP_PATH}
          className="text-ink font-medium underline decoration-hairline underline-offset-4 hover:decoration-ink"
        >
          {t("signUpSubmit")}
        </Link>
      </p>
    </div>
  );
}
