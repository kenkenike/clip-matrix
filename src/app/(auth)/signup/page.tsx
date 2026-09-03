import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, SocialButtons, Divider } from "@/app/(auth)/auth-kit";
import { SignupForm } from "@/app/(auth)/signup/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free Clip Matrix account as a creator or brand and start turning content into distribution.",
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account."
      subtitle="Join thousands of creators and brands already on the network."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SocialButtons />
      <Divider label="or" />
      <SignupForm />
    </AuthCard>
  );
}
