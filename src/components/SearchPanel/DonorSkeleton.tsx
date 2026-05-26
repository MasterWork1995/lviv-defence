export const DonorSkeleton = () => (
  <div className="space-y-1" aria-hidden="true">
    {[62, 48, 75, 40, 58].map((w, i) => (
      <div key={i} className="flex items-center gap-3 rounded-md px-3 py-3">
        <div className="h-[18px] w-[18px] flex-shrink-0 animate-pulse rounded-full bg-surface-2" />
        <div
          className="h-2.5 animate-pulse rounded bg-surface-2"
          style={{ width: `${w}%` }}
        />
        <div className="ml-auto h-2.5 w-10 flex-shrink-0 animate-pulse rounded bg-surface-2" />
      </div>
    ))}
  </div>
);
