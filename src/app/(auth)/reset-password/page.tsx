import Link from "next/link";
import { ResetForm } from "@/components/auth/forms";
import { Alert } from "@/components/ui/surface";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  if (typeof token !== "string" || token.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>This reset link is incomplete. Open the link from your email again.</Alert>
        <Link href="/forgot-password" className="text-[13px] font-semibold text-accent hover:underline">
          Send a new link
        </Link>
      </div>
    );
  }

  return <ResetForm token={token} />;
}
