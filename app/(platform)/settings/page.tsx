import { PlatformHeader } from "@/components/platform-header";
import { SettingsProfileForm } from "@/components/settings-profile-form";
import { SettingsThemeForm } from "@/components/settings-theme-form";
import { getViewer } from "@/lib/auth";

export default async function SettingsPage() {
  const viewer = await getViewer();

  return (
    <div className="space-y-10 md:space-y-12">
      <PlatformHeader
        crumbs={[{ label: "설정" }]}
        eyebrow="settings"
        title="설정"
        variant="compact"
      />

      <SettingsProfileForm viewer={viewer} />
      <SettingsThemeForm />
    </div>
  );
}
