import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, SocialButtons, Divider } from "@/app/(auth)/auth-kit";
import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Clip Matrix account to manage campaigns, clips, and earnings.",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back."
      subtitle="Log in to your Clip Matrix account."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <SocialButtons />
      <Divider label="or" />
      <LoginForm />
    </AuthCard>
  );
}
