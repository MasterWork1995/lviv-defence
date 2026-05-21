import { Header } from "@/components/Header/Header";
import { Hero } from "@/components/Hero/Hero";

export default function HomePage() {
  return (
    <div className="relative bg-bg">
      <Header />
      <main>
        <Hero />
        <section className="flex min-h-screen items-center justify-center border-t border-border bg-surface px-8 py-20">
          <div className="text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
              Секція 2
            </p>
            <h2 className="mb-4 font-display text-3xl font-bold uppercase tracking-wide text-text">
              Донори проекту
            </h2>
            <p className="max-w-md text-sm text-text-muted">
              Тут буде список всіх донорів та їхній внесок у захист Львівщини.
            </p>
          </div>
        </section>
        <section className="flex min-h-screen items-center justify-center border-t border-border bg-surface-2 px-8 py-20">
          <div className="text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
              Секція 3
            </p>
            <h2 className="mb-4 font-display text-3xl font-bold uppercase tracking-wide text-text">
              Як це працює
            </h2>
            <p className="max-w-md text-sm text-text-muted">
              Пояснення механізму фандрейзингу та розподілу коштів на купол.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
