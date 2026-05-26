import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";

export default function HomePage() {
  return (
    // CSS Grid: header takes its natural height, hero fills the rest — no hardcoded px
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-bg">
      <Header />
      <main className="min-h-0 overflow-hidden">
        <Hero />
      </main>
    </div>
  );
}
