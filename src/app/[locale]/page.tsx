import { useTranslations } from "next-intl";
import { Hero } from "@/components/Hero/Hero";
import { SearchPanel } from "@/components/SearchPanel";
import { Header } from "@/components/Header/Header";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="relative h-screen overflow-hidden bg-bg">
      <Header />
      <main className="absolute inset-0 flex overflow-hidden">
        <Hero />
        <div className="flex-shrink-0 border-l border-border bg-surface/80 backdrop-blur-sm lg:w-72 mt-[120px]">
          <SearchPanel />
        </div>
      </main>
    </div>
  );
}
