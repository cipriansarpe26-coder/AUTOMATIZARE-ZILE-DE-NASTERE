# Aplicație web — Enoriași (zile de naștere & onomastici)

Aplicație web privată (protejată cu o singură parolă) care ține evidența
enoriașilor și afișează cine are ziua de naștere sau onomastica **mâine** și
**peste o săptămână**. Odată importat `ZILE.xlsx`, gestionezi totul din
aplicație (adaugi/editezi/ștergi persoane) — nu mai ai nevoie de Excel.

Momentan aplicația **doar afișează** informația, nu trimite nimic automat
(WhatsApp/Telegram poate fi adăugat ulterior).

## Cum funcționează (pe scurt)

- **Vercel** găzduiește aplicația și îi dă un link (`https://ceva.vercel.app`).
- **Supabase** e baza de date unde stau enoriașii (înlocuiește Excel-ul).
- O singură **parolă** protejează tot site-ul — nimeni fără ea nu poate intra,
  dar tu poți accesa link-ul de pe orice telefon/tabletă/calculator.

Ambele conturi (Vercel, Supabase) sunt **gratuite** pentru acest volum de
date (~1700 persoane).

---

## Pasul 1 — Cont Supabase + baza de date

1. Mergi pe **https://supabase.com** → **„Start your project"** → creează cont
   (poți folosi contul de Google/GitHub).
2. Creează un proiect nou (**„New project"**): îi dai un nume (ex: `enoriasi`),
   o parolă pentru baza de date (o poți genera automat — nu e parola de login
   în aplicație, e alta, doar tehnică; salveaz-o undeva sigur) și alegi o
   regiune apropiată (ex: Frankfurt).
3. Așteaptă 1-2 minute până se creează proiectul.
4. În meniul din stânga, click pe **„SQL Editor"** → **„New query"**.
5. Deschide fișierul `supabase/schema.sql` din acest folder, copiază tot
   conținutul, lipește-l în editor, apoi apasă **„Run"**.
   - Ar trebui să vezi un mesaj de succes. Asta a creat tabelul `enoriasi`.
6. Mergi la **„Project Settings"** (rotița din stânga jos) → **„Data API"**.
   Notează:
   - **Project URL** (arată ca `https://xxxxxxxxxxxx.supabase.co`)
7. Tot în Settings, caută secțiunea **„API Keys"** și copiază cheia
   **`service_role`** (⚠️ NU cea `anon`/`public` — trebuie neapărat
   `service_role`, care e secretă și nu se distribuie niciodată public).

Ai acum 2 valori: **Project URL** și **service_role key**.

---

## Pasul 2 — Cont Vercel + deploy

1. Mergi pe **https://vercel.com** → **„Sign Up"** → conectează-te cu
   contul tău de **GitHub** (cel cu care ai și repository-ul
   `AUTOMATIZARE-ZILE-DE-NASTERE`).
2. Din dashboard, apasă **„Add New..."** → **„Project"**.
3. Alege din listă repository-ul **`AUTOMATIZARE-ZILE-DE-NASTERE`** →
   **„Import"**.
4. Pe ecranul de configurare, caută **„Root Directory"** → apasă „Edit" →
   alege folderul **`webapp`**. (Foarte important — fără asta, Vercel nu
   găsește aplicația.)
5. Framework Preset ar trebui să fie detectat automat ca **„Next.js"**.
6. Înainte de a apăsa Deploy, deschide secțiunea **„Environment Variables"**
   și adaugă, pe rând, aceste 4 variabile:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL-ul de la Supabase (pasul 1) |
   | `SUPABASE_SERVICE_ROLE_KEY` | cheia `service_role` de la Supabase |
   | `APP_PASSWORD` | o parolă aleasă de tine, pentru login în aplicație |
   | `AUTH_SECRET` | orice text lung și aleator (ex: 40 de caractere random — poți scrie orice, doar să nu fie ceva ghicibil) |

7. Apasă **„Deploy"**. Durează 1-3 minute.
8. La final, Vercel îți dă un link (ceva de genul
   `https://automatizare-zile-de-nastere.vercel.app`). Acela e site-ul tău.

---

## Pasul 3 — Prima folosire

1. Deschide link-ul primit de la Vercel.
2. Introdu parola pe care ai pus-o la `APP_PASSWORD`.
3. Din meniul de sus, click pe **„Import Excel"**.
4. Alege fișierul `ZILE.xlsx` de pe calculatorul tău și apasă
   **„Importă în baza de date"**.
5. Ar trebui să vezi un mesaj cu numărul de persoane importate (și câte au
   fost ignorate, dacă lipsea data nașterii).
6. Mergi pe **„Dashboard"** (pagina principală) — acolo vezi cine are ziua de
   naștere/onomastică mâine și peste o săptămână.
7. Din **„Enoriași"** poți căuta, adăuga, edita sau șterge persoane oricând,
   direct din site — fără Excel.

⚠️ După acest prim import, `ZILE.xlsx` nu mai trebuie folosit — toate
modificările se fac direct din aplicație (baza de date Supabase e acum sursa
de adevăr).

---

## Securitate — ce e deja protejat

- Site-ul e complet inaccesibil fără parola de la `APP_PASSWORD` — orice
  pagină redirecționează automat spre login dacă nu ești autentificat.
- Baza de date Supabase are „Row Level Security" activat și nicio regulă
  publică — datele nu pot fi citite de nimeni, nici măcar dacă cineva ar afla
  adresa proiectului Supabase, cu excepția cheii `service_role`, care există
  doar în variabilele de mediu de pe Vercel (nu ajunge niciodată în browser
  sau în cod sursă).
- `ZILE.xlsx` nu e comis în git (vezi `.gitignore`), la fel ca la scriptul
  Python original.

De reținut: nu împărtăși niciodată `APP_PASSWORD`, `AUTH_SECRET` sau cheia
`service_role` cu nimeni, și nu le pune în cod sursă.

## Cunoscut, acceptat: pachetul `xlsx` (parsare Excel)

Pachetul folosit pentru citirea fișierelor `.xlsx` (`xlsx`/SheetJS) are două
vulnerabilități cunoscute fără fix publicat momentan pe npm. Riscul e mic în
acest context — fișierul e încărcat exclusiv de tine, autentificat, niciodată
de un vizitator necunoscut — dar dacă la un moment dat vrei să elimini complet
acest risc, putem înlocui parsarea Excel cu o soluție alternativă.

## Rulare locală (opțional, pentru testare înainte de deploy)

```bash
cd webapp
npm install
cp .env.local.example .env.local
# editează .env.local cu valorile tale (Supabase, parolă, secret)
npm run dev
```

Deschide `http://localhost:3000`.
