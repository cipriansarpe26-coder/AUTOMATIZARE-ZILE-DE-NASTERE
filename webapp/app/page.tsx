import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { computeUpcoming, type Person, type DayReport } from "@/lib/dates";

export const dynamic = "force-dynamic";

function formatDMY(d: Date): string {
  return d.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function DaySection({ report }: { report: DayReport }) {
  const isEmpty = report.birthdays.length === 0 && report.namedays.length === 0;
  return (
    <section className="day-section">
      <h2>
        📅 {report.label} ({formatDMY(report.date)})
      </h2>
      {isEmpty && <p className="muted">Nimic de anunțat.</p>}
      {!isEmpty && (
        <ul>
          {report.birthdays.map((e, i) => (
            <li key={`b${i}`} className="entry">
              🎂 <strong>{e.fullName}</strong> — zi de naștere, împlinește {e.age} ani
              {e.saintNote && <> · Onomastică: {e.saintNote}</>}
              {e.domiciliu && <> · {e.domiciliu}</>}
            </li>
          ))}
          {report.namedays.map((e, i) => (
            <li key={`n${i}`} className="entry">
              ⛪ <strong>{e.fullName}</strong> — onomastică ({e.saints})
              {e.domiciliu && <> · {e.domiciliu}</>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  let people: Person[] = [];
  let fatalError: string | null = null;
  let queryError: string | null = null;

  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase.from("enoriasi").select("*");
    if (error) {
      queryError = error.message;
    } else {
      people = (data ?? []) as Person[];
    }
  } catch (err) {
    fatalError = err instanceof Error ? err.message : String(err);
  }

  if (fatalError) {
    return (
      <main className="page">
        <h1>🔔 Zile de naștere &amp; onomastici</h1>
        <p className="error">
          Aplicația nu s-a putut conecta la baza de date: <strong>{fatalError}</strong>
        </p>
        <p className="muted">
          Verifică în Vercel → Settings → Environment Variables că ai adăugat corect
          <code> SUPABASE_URL</code> și <code>SUPABASE_SERVICE_ROLE_KEY</code> (fără spații
          înainte/după, cheia <code>service_role</code>, nu <code>anon</code>), apoi
          redeployează.
        </p>
      </main>
    );
  }

  const { tomorrow, nextWeek } = computeUpcoming(people, todayUTC());

  return (
    <main className="page">
      <nav className="topnav">
        <span className="brand">🔔 Zile de naștere &amp; onomastici</span>
        <div className="links">
          <Link href="/enoriasi">Enoriași ({people.length})</Link>
          <Link href="/import">Import Excel</Link>
        </div>
      </nav>

      {queryError && (
        <p className="error">
          Eroare la citirea bazei de date: <strong>{queryError}</strong>
          <br />
          <span className="muted">
            Dacă mesajul spune ceva despre tabelul „enoriasi" care nu există, rulează din nou
            scriptul din <code>supabase/schema.sql</code> în Supabase → SQL Editor.
          </span>
        </p>
      )}

      {!queryError && people.length === 0 && (
        <p className="empty">
          Nu ai niciun enoriaș încă. <Link href="/import">Importă din Excel</Link> ca să
          începi.
        </p>
      )}

      <DaySection report={tomorrow} />
      <DaySection report={nextWeek} />
    </main>
  );
}
