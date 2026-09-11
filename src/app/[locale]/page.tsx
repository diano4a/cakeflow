import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth/routes";

export default function Home() {
  const t = useTranslations("Landing");

  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="type-label">{t("eyebrow")}</p>

        <h1 className="type-display divider-t mt-3 pt-5">{t("title")}</h1>

        <p className="type-body text-muted measure hairline-t mt-5 pt-5">
          {t("tagline")}
        </p>

        <div className="hairline-t mt-8 flex flex-col gap-3 pt-8 sm:flex-row">
          <Button asChild size="lg">
            <Link href={SIGN_IN_PATH}>{t("signIn")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={SIGN_UP_PATH}>{t("signUp")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
