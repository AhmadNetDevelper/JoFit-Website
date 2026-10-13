/**
 * Tags on the storefront's cached API reads, so a write the visitor just made
 * can expire exactly the data it changed (`updateTag` in the server action)
 * instead of waiting out the `revalidate` window.
 *
 * `courses`   seat counts change when someone enrols.
 * `products`  stock changes when an order is placed.
 *
 * A staff change in the admin reaches the storefront when the window ends (60s
 * for these). If that is ever too slow, the backend can call a revalidation
 * route with the same tags.
 */
export const cacheTags = {
  courses: "courses",
  products: "products",
  /** Public job listings: expired when an employer or staff change a job. */
  jobs: "jobs",
} as const;
