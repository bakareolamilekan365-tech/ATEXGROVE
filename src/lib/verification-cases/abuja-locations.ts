export const STARTER_AREAS_VERSION = "2026-10-22" as const;
export const fctLocationsVersion = STARTER_AREAS_VERSION;
export const fctLocationsDisclaimer = "Starter list, not official." as const;

export const fctAreaCouncils = [
  { name: "AMAC", areas: ["Asokoro", "Apo", "Garki", "Jabi", "Lugbe", "Maitama", "Utako", "Wuse"] },
  { name: "Bwari", areas: ["Bwari", "Byazhin", "Dutse", "Kubwa", "Kawu", "Ushafa"] },
  { name: "Gwagwalada", areas: ["Dobi", "Gwagwalada", "Gwako", "Ibwa", "Tungan Maje", "Zuba"] },
  { name: "Kuje", areas: ["Chibiri", "Gaube", "Kuje", "Kwaku", "Rubochi"] },
  { name: "Kwali", areas: ["Dafa", "Kundu", "Pai", "Wako", "Yangoji", "Kwali"] },
  { name: "Abaji", areas: ["Abaji", "Agyana", "Nuku", "Rimba", "Yaba"] },
] as const;

export type FctAreaCouncil = (typeof fctAreaCouncils)[number]["name"];
export function isFctAreaCouncil(value: string): value is FctAreaCouncil {
  return fctAreaCouncils.some((council) => council.name === value);
}
export function listedAreasFor(value: string): readonly string[] {
  return fctAreaCouncils.find((council) => council.name === value)?.areas ?? [];
}
