import type { EmploymentType, JobPosting } from "@/features/careers";
import { absoluteUrl, toMajorUnits } from "@/lib";

/**
 * A job as schema.org `JobPosting`, following the builders in
 * `lib/structured-data.ts`: every field is a fact somebody can be held to, so
 * only what the EMPLOYER stated is emitted — no salary they chose to hide, no
 * street address nobody gave, no closing date they did not set.
 *
 * `hiringOrganization` is the employer, not JoFit. JoFit runs the board; the
 * job is theirs, and saying otherwise to a search engine would claim the
 * vacancy as JoFit's own.
 *
 * Only built while the job takes applications. A closed posting left marked up
 * is exactly what gets a site's job results withdrawn.
 */
const EMPLOYMENT_TYPE: Readonly<Record<EmploymentType, string>> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  freelance: "CONTRACTOR",
  internship: "INTERN",
};

export function jobPostingJsonLd(job: JobPosting, urls: { readonly job: string; readonly employer: string }) {
  const salary = job.salary;
  const amount = (value: NonNullable<NonNullable<typeof salary>["min"]>) => toMajorUnits(value);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [job.description, ...job.requirements.map((line) => `• ${line}`)].join("\n"),
    url: urls.job,
    datePosted: job.postedAt,
    ...(job.closesOn ? { validThrough: `${job.closesOn}T23:59:59+03:00` } : {}),
    employmentType: EMPLOYMENT_TYPE[job.employmentType],
    identifier: { "@type": "PropertyValue", name: job.employer.name, value: job.reference },
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer.name,
      url: urls.employer,
      /* A mock upload is a `data:` URL — no use to a crawler, and kilobytes of noise in the page. */
      ...(job.employer.logo && !job.employer.logo.url.startsWith("data:") ? { logo: absoluteUrl(job.employer.logo.url) } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", ...(job.city ? { addressLocality: job.city.name } : {}), addressCountry: "JO" },
    },
    ...(job.workMode === "remote"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "Jordan" } }
      : {}),
    ...(salary && (salary.min || salary.max)
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: (salary.min ?? salary.max)!.currency,
            value: {
              "@type": "QuantitativeValue",
              ...(salary.min ? { minValue: amount(salary.min) } : {}),
              ...(salary.max ? { maxValue: amount(salary.max) } : {}),
              unitText: salary.period === "hour" ? "HOUR" : "MONTH",
            },
          },
        }
      : {}),
    directApply: true,
    totalJobOpenings: job.positions,
  };
}

/**
 * The `<script>` props for it. NOT `jsonLdScriptProps` from `lib/seo.ts`: that
 * serialises with a bare `JSON.stringify`, and a job's title and description
 * are written by an EMPLOYER — somebody outside JoFit. A description holding
 * `</script><script>…` would close the tag and run on the public page. Every
 * `<` is written as its JSON unicode escape instead, which is the same
 * character to a JSON parser and no tag at all to the HTML one.
 */
export function safeJsonLdScriptProps(data: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`) },
  } as const;
}
