"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, expectedSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const ok = await checkPassword(password);

  if (!ok) {
    redirect("/login?eroare=1");
  }

  const token = await expectedSessionToken();
  if (!token) {
    redirect("/login?eroare=config");
  }

  cookies().set(SESSION_COOKIE, token as string, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
