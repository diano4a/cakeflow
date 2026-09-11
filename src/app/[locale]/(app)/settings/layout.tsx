import { SettingsLayoutFrame } from "@/features/settings/settings-layout-frame";

export default function SettingsLayout({
  children,
}: LayoutProps<"/[locale]/settings">) {
  return <SettingsLayoutFrame>{children}</SettingsLayoutFrame>;
}
