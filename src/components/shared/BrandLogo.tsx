interface BrandLogoProps {
  className?: string;
  label?: string;
  showWordmark?: boolean;
  variant?: "landing" | "sidebar" | "compact";
}

export function BrandLogo({
  className = "",
  label = "Samruna",
  showWordmark = true,
  variant = "sidebar"
}: Readonly<BrandLogoProps>) {
  const classNames = ["brand-logo", `brand-logo-${variant}`, className].filter(Boolean).join(" ");

  return (
    <span className={classNames} role="img" aria-label={label}>
      <span className="brand-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img" focusable="false">
          <rect className="brand-logo-tile" x="3" y="3" width="42" height="42" rx="13" />
          <path
            className="brand-logo-glyph"
            d="M31.92 15.05c-1.72-1.08-4.35-1.82-7.03-1.82-5.14 0-8.33 2.48-8.33 6.18 0 3.11 2.2 4.72 7.37 5.53 3.49.55 4.62 1.18 4.62 2.53 0 1.51-1.55 2.39-4.32 2.39-2.82 0-5.46-.8-7.54-2.32l-2.02 3.87c2.12 1.7 5.74 2.83 9.39 2.83 5.51 0 8.95-2.48 8.95-6.49 0-3.22-2.23-4.91-7.53-5.73-3.42-.52-4.47-1.08-4.47-2.34 0-1.39 1.42-2.16 3.97-2.16 2.36 0 4.55.58 6.75 1.82l2.19-4.29Z"
          />
        </svg>
      </span>
      {showWordmark && <span className="brand-logo-wordmark">Samruna</span>}
    </span>
  );
}
