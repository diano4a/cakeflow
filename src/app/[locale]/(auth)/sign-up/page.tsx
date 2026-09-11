import { useTranslations } from "next-intl";

import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { Link } from "@/i18n/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

export default function SignUpPage() {
  const t = useTranslations("Auth");

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="type-heading">{t("signUpTitle")}</h1>
        <p className="type-body text-muted measure">{t("signUpSubtitle")}</p>
      </header>

      <SignUpForm />

      <p className="type-body text-muted hairline-t pt-4">
        {t("signUpHasAccount")}{" "}
        <Link
          href={SIGN_IN_PATH}
          className="text-ink font-medium underline decoration-hairline underline-offset-4 hover:decoration-ink"
        >
          {t("signInSubmit")}
        </Link>
      </p>
    </div>
  );
}
