import Link from "next/link";

import { PageHero, Reveal, Section } from "@/components/ui";
import { isFeatureEnabled } from "@/config";
import { communityService } from "@/features/community";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { CommunityUnavailable } from "./_components/community-unavailable";

export async function generateMetadata({ params }: PageProps<"/[locale]/community">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/community",
    title: t("community.title"),
    description: t("community.description"),
  });
}

/**
 * The route, its types and its service exist and compile; the feature is off.
 * That is the difference between a prepared boundary and an unfinished feature.
 *
 * Switched on, it is a listing in the formal design: the hero with the post
 * count, the topics as chips, and the posts as cards. Member-written text is
 * rendered as submitted, its direction detected (`dir="auto"`).
 */
export default async function CommunityPage({ params }: PageProps<"/[locale]/community">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  if (!isFeatureEnabled("community")) return <CommunityUnavailable locale={locale} />;

  const [topics, posts] = await Promise.all([
    communityService.listTopics(locale),
    communityService.listPosts({ locale, pageSize: 10 }),
  ]);

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("community.title") }]}
        title={t("community.title")}
        lead={
          <>
            {t("community.description")}{" "}
            <span className="text-white/55">{t("community.postCount", { count: number(posts.meta.totalItems) })}</span>
          </>
        }
      />

      <Section tone="muted">
        {topics.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li key={topic.id} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-body">
                {topic.name}
              </li>
            ))}
          </ul>
        ) : null}

        <Reveal stagger as="ul" className="mt-8 grid gap-5 md:grid-cols-2">
          {posts.items.map((post) => (
            <li key={post.id} className="flex">
              <article className="group relative flex w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift">
                {/* Member-written: rendered as submitted, direction auto-detected. */}
                <h2 className="text-[1.1rem] leading-snug" dir="auto">
                  <Link
                    href={localePath(locale, `/community/posts/${post.slug}`)}
                    className="after:absolute after:inset-0 after:rounded-3xl after:content-['']"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-body" dir="auto">
                  {post.excerpt}
                </p>
                <p className="mt-auto pt-5 text-[13px] text-body/70">
                  <span className="font-semibold text-ink" dir="auto">
                    {post.author.displayName}
                  </span>
                  {" · "}
                  {t("community.comments", { count: number(post.commentCount) })}
                </p>
              </article>
            </li>
          ))}
        </Reveal>
      </Section>
    </>
  );
}
