export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

export interface Address {
  readonly id: string;
  readonly label?: string;
  readonly recipientName: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly region?: string;
  readonly postalCode?: string;
  /**
   * ISO 3166-1 alpha-2. Optional: the live `AddressDto`/`AddressRequest`
   * don't carry a country at all (JoFit only ships within Jordan today) — no
   * live source to fabricate this from.
   */
  readonly countryCode?: string;
  readonly geo?: GeoPoint;
}

/** Coarse location used for filtering coaches, rentals and facilities. */
export interface Location {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly countryCode: string;
  readonly geo?: GeoPoint;
}
