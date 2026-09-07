import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Daftar Gratis",
  description:
    "Buat akun Duitku gratis dalam 1 menit, tanpa kartu kredit, dan mulai catat pemasukan serta pengeluaran Anda.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <AuthShell title="Buat akun baru" subtitle="Gratis, tanpa kartu kredit. Mulai catat keuangan dalam 1 menit.">
      <RegisterForm />
    </AuthShell>
  );
}
