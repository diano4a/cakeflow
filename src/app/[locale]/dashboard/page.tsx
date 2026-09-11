import { getLocale } from "next-intl/server";

import { getCurrentWorkspace } from "@/features/bakery/dal";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/dal";
import { APP_HOME_PATH, ONBOARDING_PATH } from "@/lib/auth/routes";

export default async function DashboardRedirectPage() {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await getCurrentWorkspace();

  return redirect({
    href: workspace ? APP_HOME_PATH : ONBOARDING_PATH,
    locale,
  });
}
