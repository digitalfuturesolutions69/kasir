"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import { Label, Input, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
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
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      <FieldError>{state.error}</FieldError>

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Masuk..." : "Masuk"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
}
