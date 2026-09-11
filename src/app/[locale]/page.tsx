import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth/routes";

export default function Home() {
  const t = useTranslations("Landing");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("tagline")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={SIGN_IN_PATH}>{t("signIn")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={SIGN_UP_PATH}>{t("signUp")}</Link>
        </Button>
      </div>
    </main>
  );
}
