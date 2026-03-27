import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export default async function SignupPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6">
      <AuthForm mode="signUp" />
    </main>
  );
}
