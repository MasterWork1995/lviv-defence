import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";

export default function HomePage() {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_minmax(0,1fr)] bg-bg xl:h-dvh xl:overflow-hidden">
      <Header />
      <main className="min-h-0 xl:overflow-hidden">
        <Hero />
      </main>
    </div>
  );
}
