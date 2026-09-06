import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Selamat datang kembali" subtitle="Masuk untuk melanjutkan mencatat keuangan Anda.">
      <LoginForm />
    </AuthShell>
  );
}
