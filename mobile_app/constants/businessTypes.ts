// Hardcoded business types (fallback / canonical list)
export const BUSINESS_TYPES = [
  { type: 'tourist_entry', category: 'event', id: '6927dd74c83ad21b4792693c' },
  { type: 'hotel', category: 'buy', id: '6927dd74c83ad21b4792693d' },
  { type: 'restaurant', category: 'buy', id: '6927dd74c83ad21b4792693e' },
  { type: 'cab', category: 'buy', id: '6927dd74c83ad21b4792693f' },
  { type: 'guide', category: 'book', id: '6927dd74c83ad21b47926940' },
  { type: 'event', category: 'event', id: '6927dd74c83ad21b47926941' },
];

// Extra fields to show in the UI for specific business types.
// Each entry describes dynamic metadata fields to collect for that type.
export const TYPE_EXTRA_FIELDS: Record<string, Array<{ key: string; label: string; placeholder?: string }>> = {
  tourist_entry: [
    { key: 'externalid', label: 'External ID', placeholder: 'External system id' },
  ],
  cab: [
    { key: 'vehicle_type', label: 'Vehicle Type', placeholder: 'e.g., Sedan, SUV' },
    { key: 'seating_capacity', label: 'Seating Capacity', placeholder: 'e.g., 4' },
  ],
  hotel: [
    { key: 'star_rating', label: 'Star Rating', placeholder: 'e.g., 3, 4, 5' },
  ],
  guide: [
    { key: 'languages', label: 'Languages', placeholder: 'Comma separated languages' },
  ],
  restaurant: [
    { key: 'cuisine', label: 'Cuisine', placeholder: 'Primary cuisine' },
  ],
  event: [
    { key: 'capacity', label: 'Capacity', placeholder: 'Number of attendees' },
  ],
};

export default BUSINESS_TYPES;
