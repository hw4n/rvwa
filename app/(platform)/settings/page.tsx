import { PlatformHeader } from "@/components/platform-header";
import { SettingsProfileForm } from "@/components/settings-profile-form";
import { requireViewer } from "@/lib/auth";

export default async function SettingsPage() {
  const viewer = await requireViewer();

  return (
    <div className="space-y-10 md:space-y-12">
      <PlatformHeader
        crumbs={[{ label: "설정" }]}
        eyebrow="settings"
        title="설정"
        variant="compact"
      />

      <SettingsProfileForm
        email={viewer.email}
        initialDisplayName={viewer.name}
      />
    </div>
  );
}
