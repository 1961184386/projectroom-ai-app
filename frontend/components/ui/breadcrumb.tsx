import Link from "next/link";

export function Breadcrumb({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
    >
      <span aria-hidden="true">‹</span>
      {label}
    </Link>
  );
}
