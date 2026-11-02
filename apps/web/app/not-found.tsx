import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg)] px-6 text-center select-none">
      <div className="space-y-3">
        <span className="font-mono text-[14px] text-[var(--text-muted)]">404</span>
        <h1 className="text-[20px] font-semibold text-[var(--text)]">Page not found</h1>
        <p className="text-[13px] text-[var(--text-muted)] max-w-sm">
          The requested page could not be located on KIET Smart Care.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-[32px] items-center justify-center px-4 rounded-[6px] bg-[var(--text)] text-[var(--bg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

