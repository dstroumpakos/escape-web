/** A company logo, or its first letter when it has none. */
export function CompanyLogo({ name, logo, size }: { name: string; logo: string; size: number }) {
  const ok = logo && /^https?:\/\//.test(logo);
  return (
    <div
      className="rounded-xl overflow-hidden bg-black/50 border border-brand-border flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-display font-bold text-brand-red-light" style={{ fontSize: size * 0.42 }}>
          {(name || '?').charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
