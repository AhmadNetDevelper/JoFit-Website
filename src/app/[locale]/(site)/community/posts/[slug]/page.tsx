import { notFound } from "next/navigation";

import { PageHero, Section } from "@/components/ui";
import { isFeatureEnabled } from "@/config";
import { communityService } from "@/features/community";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { CommunityUnavailable } from "../../_components/community-unavailable";

export async function generateMetadata({ params }: PageProps<"/[locale]/community/posts/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  if (!isFeatureEnabled("community")) return buildMetadata({ locale, noIndex: true });

  const post = await communityService.getPostBySlug(slug, locale);
  if (!post) return buildMetadata({ locale, title: "Not found", noIndex: true });

  return buildMetadata({
    locale,
    title: post.title,
    description: post.excerpt,
    path: `/community/posts/${post.slug}`,
    type: "article",
  });
}

/**
 * A community post: the hero carries the member's title and excerpt, then the
 * post and its comments at a reading measure. Everything a member wrote is
 * rendered as submitted, its direction detected.
 */
export default async function CommunityPostPage({ params }: PageProps<"/[locale]/community/posts/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  if (!isFeatureEnabled("community")) return <CommunityUnavailable locale={locale} />;

  const post = await communityService.getPostBySlug(slug, locale);
  if (!post) notFound();

  const comments = await communityService.listComments(post.id);

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("community.title"), href: localePath(locale, "/community") },
          { label: post.title },
        ]}
        title={<span dir="auto">{post.title}</span>}
        lead={<span dir="auto">{post.excerpt}</span>}
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="text-[1.05rem] leading-relaxed whitespace-pre-line text-body" dir="auto">
            {post.body}
          </p>

          <section aria-labelledby="comments-heading" className="mt-14 border-t border-line pt-10">
            <h2 id="comments-heading" className="text-[1.5rem] leading-snug">
              {t("community.comments", { count: number(comments.length) })}
            </h2>
            <ul className="mt-6 grid gap-4">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded-2xl border border-line bg-canvas p-5">
                  <p className="text-[14px] font-semibold text-ink" dir="auto">
                    {comment.author.displayName}
                  </p>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-body" dir="auto">
                    {comment.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Section>
    </>
  );
}
