const wordmarks = [
  "Northbeam Labs",
  "Podium FM",
  "Hexforge Games",
  "Lumen Audio",
  "Cartel Supply",
  "Statline",
  "Orbit Agency",
];

export function LogoStrip() {
  return (
    <section className="border-y border-line bg-surface-alt py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted">
          Built for brands that want attention.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14">
          {wordmarks.map((name) => (
            <span
              key={name}
              className="font-heading text-base font-bold tracking-wide text-fg/35 grayscale transition-colors duration-200 hover:text-fg/70"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
