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
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("enoriasi").select("*");
  const people = (data ?? []) as Person[];
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

      {error && <p className="error">Eroare la citirea bazei de date: {error.message}</p>}

      {!error && people.length === 0 && (
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
