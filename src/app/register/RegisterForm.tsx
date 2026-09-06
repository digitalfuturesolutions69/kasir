"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { Label, Input, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input id="name" name="name" type="text" autoComplete="name" placeholder="Nama Anda" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Kata Sandi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 6 karakter"
          required
          minLength={6}
        />
      </div>

      <FieldError>{state.error}</FieldError>

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Membuat akun..." : "Buat Akun Gratis"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
