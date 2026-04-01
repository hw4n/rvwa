import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <AuthForm mode="signIn" />
    </main>
  );
}
