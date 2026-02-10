export const PORTUGAL_REGIONS = [
  { id: "norte", name: "Norte" },
  { id: "centro", name: "Centro" },
  { id: "lisboa", name: "Lisboa" },
  { id: "alentejo", name: "Alentejo" },
  { id: "algarve", name: "Algarve" },
  { id: "acores", name: "Açores" },
  { id: "madeira", name: "Madeira" },
] as const;

export type RegionId = (typeof PORTUGAL_REGIONS)[number]["id"];
