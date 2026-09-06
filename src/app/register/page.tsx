import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell title="Buat akun baru" subtitle="Gratis, tanpa kartu kredit. Mulai catat keuangan dalam 1 menit.">
      <RegisterForm />
    </AuthShell>
  );
}
