import { useTranslations } from "next-intl";

import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { Link } from "@/i18n/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

export default function SignUpPage() {
  const t = useTranslations("Auth");

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("signUpTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("signUpSubtitle")}</p>
      </div>

      <SignUpForm />

      <p className="text-sm text-muted-foreground">
        {t("signUpHasAccount")}{" "}
        <Link
          href={SIGN_IN_PATH}
          className="font-medium text-foreground underline"
        >
          {t("signInSubmit")}
        </Link>
      </p>
    </div>
  );
}
