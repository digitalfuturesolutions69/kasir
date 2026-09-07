"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { isRateLimited } from "@/lib/rate-limit";

async function clientIp() {
  const h = await headers();
  // Nginx's $proxy_add_x_forwarded_for appends the real peer address as
  // the LAST entry, after whatever the client itself claimed — so the
  // first entry is attacker-controlled (trivially spoofable to dodge
  // rate limiting) and only the last one is trustworthy here, since
  // there's exactly one hop between the client and this app.
  const forwardedFor = h.get("x-forwarded-for");
  const last = forwardedFor?.split(",").pop()?.trim();
  return last || h.get("x-real-ip") || "unknown";
}

export type AuthFormState = {
  error?: string;
};

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const ip = await clientIp();
  if (isRateLimited(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Terlalu banyak percobaan daftar dari perangkat ini. Coba lagi nanti." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email sudah terdaftar. Silakan masuk." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      categories: {
        create: DEFAULT_CATEGORIES,
      },
    },
  });

  await setSessionCookie({ userId: user.id, email: user.email, name: user.name });
  redirect("/dashboard");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const ip = await clientIp();
  if (isRateLimited(`login:${ip}`, 8, 5 * 60 * 1000)) {
    return { error: "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email atau kata sandi salah" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Email atau kata sandi salah" };
  }

  await setSessionCookie({ userId: user.id, email: user.email, name: user.name });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
