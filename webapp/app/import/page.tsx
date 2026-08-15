import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { importExcel } from "./actions";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: { eroare?: string; succes?: string; importate?: string; ignorate?: string };
}) {
  let existing = 0;
  let fatalError: string | null = null;

  try {
    const supabase = supabaseServer();
    const { count } = await supabase.from("enoriasi").select("id", { count: "exact", head: true });
    existing = count ?? 0;
  } catch (err) {
    fatalError = err instanceof Error ? err.message : String(err);
  }

  if (fatalError) {
    return (
      <main className="page">
        <h1>Import din Excel</h1>
        <p className="error">
          Aplicația nu s-a putut conecta la baza de date: <strong>{fatalError}</strong>
        </p>
        <p className="muted">
          Verifică în Vercel → Settings → Environment Variables că ai adăugat corect
          <code> SUPABASE_URL</code> și <code>SUPABASE_SERVICE_ROLE_KEY</code>, apoi
          redeployează.
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <nav className="topnav">
        <Link href="/">← Dashboard</Link>
      </nav>

      <h1>Import din Excel</h1>
      <p className="muted">
        Fișierul trebuie să aibă coloanele, în ordine: NUME, PRENUME, DATA NAȘTERII,
        luna (ignorată), DOMICILIUL, MENȚIUNI — la fel ca ZILE.xlsx. Rândurile fără
        dată de naștere validă sunt ignorate automat.
      </p>

      {existing > 0 && (
        <p className="warning">
          ⚠️ Baza de date conține deja <strong>{existing}</strong> persoane. Alege mai
          jos ce vrei să se întâmple la import.
        </p>
      )}

      {searchParams?.eroare && (
        <p className="error">Eroare: {decodeURIComponent(searchParams.eroare)}</p>
      )}
      {searchParams?.succes && (
        <p className="success">
          ✅ Import reușit: {searchParams.importate} persoane adăugate
          {Number(searchParams.ignorate) > 0 &&
            `, ${searchParams.ignorate} rânduri ignorate (fără dată de naștere validă)`}
          .
        </p>
      )}

      <form action={importExcel} encType="multipart/form-data" className="import-form">
        <label>
          Fișier Excel (.xlsx)
          <input type="file" name="file" accept=".xlsx" required />
        </label>

        {existing > 0 && (
          <fieldset>
            <label>
              <input type="radio" name="mode" value="adauga" defaultChecked />
              Adaugă peste cei existenți
            </label>
            <label>
              <input type="radio" name="mode" value="sterge_si_reimporta" />
              Șterge tot și reimportă de la zero
            </label>
          </fieldset>
        )}

        <button type="submit">Importă în baza de date</button>
      </form>
    </main>
  );
}
