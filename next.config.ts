import type { NextConfig } from "next";

/*
 * Caching headers are applied in PRODUCTION ONLY.
 *
 * `next.config.ts` headers apply to the dev server too, and `/images/*` are
 * files people edit by hand. Telling a browser to hold them while someone is
 * working on them means their changes stop showing up, so the rule is gated
 * and dev keeps Next's default revalidate-every-time behaviour.
 */
const isProd = process.env.NODE_ENV === "production";

/*
 * WHERE UPLOADED IMAGES COME FROM.
 *
 * Staff upload photos in the admin; the storefront shows them. In mock mode
 * they arrive through the dev bridge as `data:` URLs, which next/image renders
 * as they are. Against an API, a MediaImage's `url` points at the media host —
 * the API itself in development (`http://localhost:4000/media/…`), a CDN in
 * production — and the image optimiser only fetches from hosts named here.
 *
 * Set NEXT_PUBLIC_MEDIA_BASE_URL to the CDN's origin in production. The API's
 * own origin is allowed as well, so a backend that serves files itself works
 * without extra configuration.
 */
function mediaHosts() {
  const origins = [
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    isProd ? undefined : "http://localhost:4000",
  ].filter((value): value is string => Boolean(value));
  return [...new Set(origins)].flatMap((origin) => {
    try {
      const url = new URL(origin);
      return [
        {
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          port: url.port,
          pathname: "/**",
        },
      ];
    } catch {
      return [];
    }
  });
}

const nextConfig: NextConfig = {
  // Next generates AGENTS.md/CLAUDE.md by default; this project documents itself
  // in README.md, so the generated copies are just noise in the repo.
  agentRules: false,

  /*
   * A candidate's CV (up to 5 MB), an employer's logo (up to 2 MB) and a
   * coach's registration (a photo plus certificate files, 10 MB together)
   * arrive through Server Actions, whose default body limit is 1 MB. 12 MB
   * leaves room for the form fields and the multipart framing; the forms and
   * services refuse anything larger than their own limits regardless.
   */
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },

  images: {
    /* AVIF first, WebP second, for everything drawn through `next/image`. */
    formats: ["image/avif", "image/webp"],
    // Nothing on the site needs a 3840px variant, and every extra entry is
    // another size the optimiser can be asked to generate.
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: mediaHosts(),
    /* The development media host is localhost; the optimiser refuses local
       addresses unless told otherwise, and never in production. */
    dangerouslyAllowLocalIP: !isProd,
  },

  async headers() {
    if (!isProd) return [];
    return [
      {
        /*
         * The images are NOT content-hashed — `/images/hero/hero-bg.jpg` keeps
         * its name when it is re-encoded. A year would strand anyone who has
         * the old bytes, so this is a day of freshness with a week of serving
         * the stale copy while a new one is fetched behind it.
         */
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
