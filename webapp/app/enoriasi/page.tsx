import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface PersonRow {
  id: string | number;
  nume: string;
  prenume: string;
  data_nasterii: string;
  domiciliu: string | null;
  mentiuni: string | null;
}

function formatDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export default async function EnoriasiPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";
  let people: PersonRow[] = [];
  let error: string | null = null;

  try {
    const supabase = supabaseServer();
    let query = supabase.from("enoriasi").select("*").order("nume").order("prenume");
    if (q) {
      const escaped = q.replace(/[%_]/g, "");
      query = query.or(`nume.ilike.%${escaped}%,prenume.ilike.%${escaped}%`);
    }
    const { data, error: queryError } = await query;
    if (queryError) {
      error = queryError.message;
    } else {
      people = (data ?? []) as PersonRow[];
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="page">
      <nav className="topnav">
        <Link href="/">← Dashboard</Link>
        <Link href="/enoriasi/nou" className="button">
          + Adaugă enoriaș
        </Link>
      </nav>

      <h1>Enoriași ({people.length})</h1>

      <form className="search" method="get">
        <input type="text" name="q" placeholder="Caută după nume sau prenume..." defaultValue={q} />
        <button type="submit">Caută</button>
      </form>

      {error && <p className="error">{error}</p>}

      {people.length === 0 && !error && <p className="muted">Niciun rezultat.</p>}

      {people.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nume</th>
              <th>Prenume</th>
              <th>Data nașterii</th>
              <th>Domiciliu</th>
              <th>Mențiuni</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td data-label="Nume">{p.nume}</td>
                <td data-label="Prenume">{p.prenume}</td>
                <td data-label="Data nașterii">{formatDMY(p.data_nasterii)}</td>
                <td data-label="Domiciliu">{p.domiciliu}</td>
                <td data-label="Mențiuni">{p.mentiuni}</td>
                <td data-label="">
                  <Link href={`/enoriasi/${p.id}`}>Editează</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
