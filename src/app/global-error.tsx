"use client";

/**
 * Last-resort boundary: it replaces the root layout, so it must render its own
 * `<html>` and `<body>` and cannot use shared components or a dictionary. It
 * shows both languages because it cannot know which one the visitor was in.
 */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>Something went wrong · حدث خطأ ما</h1>
          <p>{error.message}</p>
          <button type="button" onClick={reset}>
            Try again · إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
