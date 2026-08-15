import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Enoriași — Zile de naștere & onomastici",
  description: "Evidență enoriași, zile de naștere și onomastici.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
