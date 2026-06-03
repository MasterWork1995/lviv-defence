export const DonorSkeleton = () => (
  <ul
    className="max-h-[240px] space-y-1 overflow-y-auto pr-1"
    aria-hidden="true"
  >
    {[62, 48, 75, 40, 58].map((w, i) => (
      <li key={i}>
        <div className="grid w-full grid-cols-[22px_1fr_auto_12px] items-center gap-2.5 rounded-md border border-border/40 bg-surface-2/30 px-3 py-2.5">
          <div className="h-[22px] w-[22px] animate-pulse rounded-full bg-surface-2" />
          <div
            className="h-2.5 animate-pulse rounded bg-surface-2"
            style={{ width: `${w}%` }}
          />
          <div className="h-2.5 w-10 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-3 animate-pulse rounded bg-surface-2" />
        </div>
      </li>
    ))}
  </ul>
);
