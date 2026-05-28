import { Exo_2, Russo_One } from "next/font/google";
import "../globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const russoOne = Russo_One({
  variable: "--font-russo",
  subsets: ["latin", "cyrillic"],
  weight: "400",
});

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${exo2.variable} ${russoOne.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
