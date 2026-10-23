export const LEGACY_LOCATION_NOTE = "Detailed location not recorded (created before the structured form)";

export function caseLocationDisplay(areaName: string | null, areaCouncil: string) {
  return {
    heading: areaName ? `${areaName}, ${areaCouncil}, Abuja` : `${areaCouncil}, Abuja`,
    legacy: areaName === null,
    note: areaName === null ? LEGACY_LOCATION_NOTE : null,
  };
}
