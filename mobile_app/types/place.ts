export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: "tourist" | "food" | "police" | "hospital" | "other";
  description: string;
};
