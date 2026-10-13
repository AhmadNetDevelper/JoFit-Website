"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useCart } from "../hooks/use-cart";

/**
 * Lives in the cart feature, not in shared layout components: it is cart
 * business state rendered in the site chrome.
 *
 * All copy arrives as props from the Server Component that renders it, so no
 * dictionary is shipped to the browser for the sake of two words.
 */
export function CartIndicator({
  href,
  label,
  itemsLabelTemplate,
  className = "text-sm",
  icon,
  hideLabel = false,
}: {
  href: string;
  label: string;
  /** Contains a literal `{count}` placeholder for the accessible name. */
  itemsLabelTemplate: string;
  /**
   * The chrome that renders this decides how it looks. The header needs its
   * own link class because on the template route the vendor's `a { color }`
   * outranks a Tailwind utility.
   */
  className?: string;
  /** Rendered before the label. A node, so the chrome owns the icon set. */
  icon?: ReactNode;
  /**
   * Icon and count only. The word stays in the accessible name, so a screen
   * reader still hears "Cart" rather than a bare number. Pass an `icon` with
   * it — without one the link is just "(0)".
   */
  hideLabel?: boolean;
}) {
  const { totals, isHydrated } = useCart();
  const count = isHydrated ? totals.itemCount : 0;

  return (
    <Link href={href} className={className}>
      {icon}
      {hideLabel ? <span className="sr-only">{label}</span> : label}
      <span aria-hidden="true">{` (${count})`}</span>
      <span className="sr-only">{itemsLabelTemplate.replace("{count}", String(count))}</span>
    </Link>
  );
}
