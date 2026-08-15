"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

interface PersonInput {
  nume: string;
  prenume: string;
  data_nasterii: string;
  domiciliu: string | null;
  mentiuni: string | null;
}

function readForm(formData: FormData): PersonInput {
  const nume = String(formData.get("nume") ?? "").trim();
  const prenume = String(formData.get("prenume") ?? "").trim();
  const data_nasterii = String(formData.get("data_nasterii") ?? "").trim();
  const domiciliu = String(formData.get("domiciliu") ?? "").trim() || null;
  const mentiuni = String(formData.get("mentiuni") ?? "").trim() || null;

  if (!nume || !prenume || !data_nasterii) {
    throw new Error("Nume, prenume și data nașterii sunt obligatorii.");
  }

  return { nume, prenume, data_nasterii, domiciliu, mentiuni };
}

export async function createPerson(formData: FormData) {
  const supabase = supabaseServer();
  const input = readForm(formData);

  const { error } = await supabase.from("enoriasi").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/enoriasi");
  revalidatePath("/");
  redirect("/enoriasi");
}

export async function updatePerson(id: string, formData: FormData) {
  const supabase = supabaseServer();
  const input = readForm(formData);

  const { error } = await supabase.from("enoriasi").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/enoriasi");
  revalidatePath("/");
  redirect("/enoriasi");
}

export async function deletePerson(id: string) {
  const supabase = supabaseServer();
  const { error } = await supabase.from("enoriasi").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/enoriasi");
  revalidatePath("/");
  redirect("/enoriasi");
}
