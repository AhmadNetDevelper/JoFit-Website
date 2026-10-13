export interface MediaImage {
  readonly kind: "image";
  readonly id: string;
  readonly url: string;
  /** Empty string marks the image as decorative for screen readers. */
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly blurDataUrl?: string;
}

export interface MediaVideo {
  readonly kind: "video";
  readonly id: string;
  readonly url: string;
  readonly posterUrl?: string;
  readonly durationSeconds?: number;
}

export type Media = MediaImage | MediaVideo;
