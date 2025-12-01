export type Category = "tourist" | "hospital" | "police" | "food" | "other";

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: Category;
  description: string;
};

export const DEFAULT_PLACES: Place[] = [
  {
    id: "1",
    name: "MG Marg",
    latitude: 27.3314,
    longitude: 88.6138,
    category: "tourist",
    description: "Famous shopping street in Gangtok.",
  },
];
