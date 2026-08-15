// Logică calcul zile de naștere & onomastici — portată 1:1 din main.py
// (script-ul Python original). NU schimba regulile fără sincronizare cu main.py.

export const FIXED_SAINTS: Record<string, [number, number]> = {
  VASILE: [1, 1],
  ION: [1, 7],
  GABRIEL: [3, 26],
  GHEORGHE: [4, 23],
  CONSTANTIN: [5, 21],
  NICOLAE: [12, 6],
  MARIA: [8, 15],
};

export const SAINT_DISPLAY: Record<string, string> = {
  VASILE: "Sf. Vasile",
  ION: "Sf. Ion",
  GABRIEL: "Sf. Gabriel",
  GHEORGHE: "Sf. Gheorghe",
  CONSTANTIN: "Sf. Constantin",
  NICOLAE: "Sf. Nicolae",
  MARIA: "Sf. Maria",
  FLORII: "Florii",
};

const FLORII_TOKEN = "FLORII";

export interface Person {
  id: string | number;
  nume: string;
  prenume: string;
  data_nasterii: string; // "YYYY-MM-DD"
  domiciliu: string | null;
  mentiuni: string | null;
}

export interface DayEntry {
  kind: "birthday" | "nameday";
  fullName: string;
  age?: number;
  saintNote?: string;
  saints?: string;
  domiciliu?: string | null;
}

export interface DayReport {
  label: string;
  date: Date;
  birthdays: DayEntry[];
  namedays: DayEntry[];
}

// --- Paștele Ortodox / Florii (algoritmul Meeus, variantă iuliană + 13 zile) ---

export function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 1-indexat (3=martie, 4=aprilie)
  const day = ((d + e + 114) % 31) + 1;
  const julian = new Date(Date.UTC(year, month - 1, day));
  julian.setUTCDate(julian.getUTCDate() + 13);
  return julian;
}

export function floriiDate(year: number): Date {
  const d = new Date(orthodoxEaster(year));
  d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

// --- Utilitare date (toate lucrează cu date UTC "calendaristice", fără oră) ---

export function dateOnlyUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function sameDate(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export function parseISODateUTC(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  return dateOnlyUTC(Number(y), Number(m), Number(d));
}

function safeDate(year: number, month: number, day: number): Date {
  const d = dateOnlyUTC(year, month, day);
  if (d.getUTCMonth() !== month - 1) {
    // 29 februarie într-un an nebisect -> fallback 28 februarie
    return dateOnlyUTC(year, 2, 28);
  }
  return d;
}

export function nextOccurrence(month: number, day: number, today: Date): Date {
  let candidate = safeDate(today.getUTCFullYear(), month, day);
  if (candidate.getTime() < today.getTime()) {
    candidate = safeDate(today.getUTCFullYear() + 1, month, day);
  }
  return candidate;
}

export function nextFlorii(today: Date): Date {
  let candidate = floriiDate(today.getUTCFullYear());
  if (candidate.getTime() < today.getTime()) {
    candidate = floriiDate(today.getUTCFullYear() + 1);
  }
  return candidate;
}

// --- Normalizare MENȚIUNI ---

const DIACRITICS: Record<string, string> = {
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
};

export function normalizeToken(text: string): string {
  let out = text.trim().toUpperCase();
  for (const [src, dst] of Object.entries(DIACRITICS)) {
    out = out.split(src).join(dst);
  }
  return out;
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function mentiuniTokens(person: Person): string[] {
  if (!person.mentiuni) return [];
  return person.mentiuni
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function mentiuniDisplay(person: Person): string | null {
  const tokens = mentiuniTokens(person);
  if (tokens.length === 0) return null;
  return tokens
    .map((token) => {
      const norm = normalizeToken(token);
      return SAINT_DISPLAY[norm] ?? titleCase(token);
    })
    .join(", ");
}

// --- Construirea rapoartelor (mâine / peste o săptămână) ---

export function computeUpcoming(
  people: Person[],
  today: Date
): { tomorrow: DayReport; nextWeek: DayReport } {
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const reportFor = (label: string, target: Date): DayReport => {
    const birthdays: DayEntry[] = [];
    const namedays: DayEntry[] = [];

    for (const person of people) {
      const bd = parseISODateUTC(person.data_nasterii);
      if (!bd) continue;

      const nextBday = nextOccurrence(bd.getUTCMonth() + 1, bd.getUTCDate(), today);
      if (sameDate(nextBday, target)) {
        const age = target.getUTCFullYear() - bd.getUTCFullYear();
        birthdays.push({
          kind: "birthday",
          fullName: `${person.nume} ${person.prenume}`.trim(),
          age,
          saintNote: mentiuniDisplay(person) ?? undefined,
          domiciliu: person.domiciliu,
        });
      }

      const tokens = mentiuniTokens(person);
      if (tokens.length > 0) {
        const matched: string[] = [];
        for (const token of tokens) {
          const norm = normalizeToken(token);
          let occ: Date | null = null;
          if (norm === FLORII_TOKEN) {
            occ = nextFlorii(today);
          } else if (FIXED_SAINTS[norm]) {
            const [m, d] = FIXED_SAINTS[norm];
            occ = nextOccurrence(m, d, today);
          }
          if (occ && sameDate(occ, target)) {
            matched.push(SAINT_DISPLAY[norm] ?? titleCase(token));
          }
        }
        if (matched.length > 0) {
          namedays.push({
            kind: "nameday",
            fullName: `${person.nume} ${person.prenume}`.trim(),
            saints: matched.join(", "),
            domiciliu: person.domiciliu,
          });
        }
      }
    }

    birthdays.sort((a, b) => a.fullName.localeCompare(b.fullName, "ro"));
    namedays.sort((a, b) => a.fullName.localeCompare(b.fullName, "ro"));

    return { label, date: target, birthdays, namedays };
  };

  return {
    tomorrow: reportFor("MÂINE", tomorrow),
    nextWeek: reportFor("PESTE O SĂPTĂMÂNĂ", nextWeek),
  };
}
