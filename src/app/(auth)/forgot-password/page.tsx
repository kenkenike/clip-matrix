import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/app/(auth)/auth-kit";
import { ForgotForm } from "@/app/(auth)/forgot-password/forgot-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Clip Matrix account password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password."
      subtitle="Enter the email on your account and we will send reset instructions."
      footer={
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to log in
        </Link>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
