import { resolveText, type Locale, type LocalizedText } from "@/i18n";

import { mockCoaches } from "../coaches";
import { mockCourses } from "../education";
import { mockRentalItems } from "../rental";
import { mockProducts } from "../shop";

/**
 * How a signed-in screen names and links the catalogue things a record points
 * at. An order line, a hire, a session and a review all carry an id; this turns
 * that id into the title in the reader's language and the public page it lives
 * on. One place, so the account area and the coach area can never disagree
 * about what "prod-trail-runner" is called in Arabic.
 */
export function productRef(id: string | undefined, locale: Locale) {
  const product = id ? mockProducts.find((entry) => entry.id === id) : undefined;
  return product
    ? { title: resolveText(product.title, locale), href: `/shop/products/${product.slug}` }
    : undefined;
}

export function rentalItemRef(id: string | undefined, locale: Locale) {
  const item = id ? mockRentalItems.find((entry) => entry.id === id) : undefined;
  return item
    ? { title: resolveText(item.title, locale), href: `/rental/items/${item.slug}` }
    : undefined;
}

export function coachRef(id: string, locale: Locale) {
  const coach = mockCoaches.find((entry) => entry.id === id);
  return coach
    ? { title: resolveText(coach.name, locale), href: `/coaches/${coach.slug}`, raw: coach }
    : undefined;
}

export function courseRef(id: string, locale: Locale) {
  const course = mockCourses.find((entry) => entry.id === id);
  return course
    ? {
        title: resolveText(course.title, locale),
        href: `/education/courses/${course.slug}`,
        price: course.price.current,
        raw: course,
      }
    : undefined;
}

export function targetRef(type: string, id: string, locale: Locale) {
  switch (type) {
    case "product":
      return productRef(id, locale);
    case "rental-item":
      return rentalItemRef(id, locale);
    case "coach":
      return coachRef(id, locale);
    default:
      return courseRef(id, locale);
  }
}

export const text = (value: LocalizedText, locale: Locale) => resolveText(value, locale);
