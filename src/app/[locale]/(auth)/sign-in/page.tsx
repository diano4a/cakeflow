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
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("signInTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("signInSubtitle")}</p>
      </div>

      <SignInForm
        redirectTo={typeof redirectTo === "string" ? redirectTo : undefined}
      />

      <p className="text-sm text-muted-foreground">
        {t("signInNoAccount")}{" "}
        <Link
          href={SIGN_UP_PATH}
          className="font-medium text-foreground underline"
        >
          {t("signUpSubmit")}
        </Link>
      </p>
    </div>
  );
}
