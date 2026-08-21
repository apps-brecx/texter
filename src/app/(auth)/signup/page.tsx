import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "@/components/auth/forms";

export const metadata = { title: "Create a workspace" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <SignupForm />;
}
