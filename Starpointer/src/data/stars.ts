// src/data/stars.ts
import starJson from "./stars.json" assert { type: "json" };

export type StarImageMeta = {
  src: string;
  title: string;
  attribution: string;
};

type StarRecord = {
  name: string;
  catalogId: number;
  image?: StarImageMeta;
  aliases?: string[];
  magnitude?: string;
  distance?: string;
  spectralType?: string;
  coordinates?: string;
  summary?: string;
  moreInfoUrl?: string;
};

export type Star = {
  id: string;
  name: string;
  catalogId: number;
  description: string;
  image?: StarImageMeta;
  aliases?: string[];
  magnitude?: string;
  distance?: string;
  spectralType?: string;
  coordinates?: string;
  summary?: string;
  moreInfoUrl?: string;
};

const parsedStars = (starJson as StarRecord[]).map(entry => ({
  ...entry,
}));

export const STARS: Star[] = parsedStars
  .map(({ name, catalogId, image, summary, aliases, magnitude, distance, spectralType, coordinates, moreInfoUrl }) => ({
    id: `star-${catalogId}`,
    name,
    catalogId,
    image,
    aliases,
    magnitude,
    distance,
    spectralType,
    coordinates,
    summary,
    moreInfoUrl,
    description:
      summary ??
      `${name} is catalog entry ${catalogId} in the CosmoStart pointing registry.`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const STAR_IDS: Record<string, number> = STARS.reduce((acc, star) => {
  acc[star.name] = star.catalogId;
  return acc;
}, {} as Record<string, number>);
