"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function excelSerialToDate(serial: number): Date {
  // Excel epoch 1899-12-30 (include bug-ul de an bisect 1900, la fel ca main.py)
  const epochMs = Date.UTC(1899, 11, 30);
  return new Date(epochMs + Math.round(serial) * 24 * 60 * 60 * 1000);
}

function parseBirthDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return toISODate(new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())));
  }

  if (typeof value === "number") {
    return toISODate(excelSerialToDate(value));
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;

    let m = /^(\d{2})[/.](\d{2})[/.](\d{4})$/.exec(text); // dd/mm/yyyy sau dd.mm.yyyy
    if (m) return toISODate(new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]))));

    m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text); // dd-mm-yyyy
    if (m) return toISODate(new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]))));

    m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text); // yyyy-mm-dd
    if (m) return toISODate(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))));

    return null;
  }

  return null;
}

interface ImportRow {
  nume: string;
  prenume: string;
  data_nasterii: string;
  domiciliu: string | null;
  mentiuni: string | null;
}

export async function importExcel(formData: FormData) {
  const supabase = supabaseServer();
  const file = formData.get("file") as File | null;
  const mode = String(formData.get("mode") ?? "adauga");

  if (!file || file.size === 0) {
    redirect("/import?eroare=" + encodeURIComponent("Alege un fișier Excel (.xlsx)."));
  }

  let workbook: XLSX.WorkBook;
  try {
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch {
    redirect("/import?eroare=" + encodeURIComponent("Fișierul nu a putut fi citit ca Excel valid."));
  }

  const sheetName = workbook!.SheetNames.includes("Sheet1")
    ? "Sheet1"
    : workbook!.SheetNames[0];
  const sheet = workbook!.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const dataRows = rows.slice(1); // sărim rândul de titluri

  const toInsert: ImportRow[] = [];
  let ignorate = 0;

  for (const row of dataRows) {
    const numeRaw = row[0];
    const prenumeRaw = row[1];
    const dataNasteriiRaw = row[2];
    const domiciliuRaw = row[4];
    const mentiuniRaw = row[5];

    const nume = numeRaw != null ? String(numeRaw).trim() : "";
    const prenume = prenumeRaw != null ? String(prenumeRaw).trim() : "";

    if (!nume && !prenume && dataNasteriiRaw == null) continue; // rând complet gol

    const data_nasterii = parseBirthDate(dataNasteriiRaw);
    if (!data_nasterii) {
      ignorate++;
      continue;
    }

    toInsert.push({
      nume,
      prenume,
      data_nasterii,
      domiciliu: domiciliuRaw != null ? String(domiciliuRaw).trim() || null : null,
      mentiuni: mentiuniRaw != null ? String(mentiuniRaw).trim() || null : null,
    });
  }

  if (mode === "sterge_si_reimporta") {
    const { error: delError } = await supabase.from("enoriasi").delete().neq("id", 0);
    if (delError) {
      redirect("/import?eroare=" + encodeURIComponent(delError.message));
    }
  }

  const CHUNK = 500;
  let importate = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { error } = await supabase.from("enoriasi").insert(chunk);
    if (error) {
      redirect(
        `/import?eroare=${encodeURIComponent(error.message)}&importate=${importate}`
      );
    }
    importate += chunk.length;
  }

  revalidatePath("/");
  revalidatePath("/enoriasi");
  redirect(`/import?succes=1&importate=${importate}&ignorate=${ignorate}`);
}
