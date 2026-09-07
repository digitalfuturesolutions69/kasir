import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Duitku Anda untuk melanjutkan mencatat keuangan.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <AuthShell title="Selamat datang kembali" subtitle="Masuk untuk melanjutkan mencatat keuangan Anda.">
      <LoginForm />
    </AuthShell>
  );
}
