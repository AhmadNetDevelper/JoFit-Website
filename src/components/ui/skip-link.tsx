/**
 * First focusable element on the page, letting keyboard and screen-reader users
 * bypass the navigation. `start-4` rather than `left-4`, so it lands on the
 * correct side in both text directions.
 */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:rounded focus:border focus:bg-white focus:px-4 focus:py-2"
    >
      {label}
    </a>
  );
}
