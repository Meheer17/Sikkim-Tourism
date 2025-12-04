export type FieldType = 'text' | 'longtext' | 'number' | 'tags' | 'keyvalueArray' | 'select' | 'datetime' | 'json';

export interface FieldDescriptor {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>; // for select
  min?: number;
  max?: number;
}

// Common mandatory fields (these are already present in the UI and always required)
export const COMMON_MANDATORY = [
  'name',
  'price',
  'bid',
  'description',
  'features',
  'short_description',
];

// Per-type field configuration. These fields will be shown dynamically when a type is selected.
// Fields here are intended to be stored inside the service `metadata` array (dynamic JSON entries).
export const TYPE_FIELD_CONFIG: Record<string, FieldDescriptor[]> = {
  tourist_entry: [
    { key: 'externalid', label: 'External ID', type: 'text', required: false, placeholder: 'External system id' },
    { key: 'ticket_type', label: 'Ticket Type', type: 'text', required: false, placeholder: 'e.g., adult/child' },
    { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number', required: false, placeholder: 'e.g., 120' },
    { key: 'capacity', label: 'Capacity', type: 'number', required: false, placeholder: 'Number of attendees' },
  ],
  hotel: [
    { key: 'star_rating', label: 'Star Rating', type: 'number', required: false, placeholder: 'e.g., 3,4,5' },
    { key: 'room_types', label: 'Room Types (JSON)', type: 'json', required: false, placeholder: '[{"name":"Deluxe","price":...}]' },
    { key: 'amenities', label: 'Amenities (comma separated)', type: 'tags', required: false, placeholder: 'e.g., wifi,pool' },
  ],
  restaurant: [
    { key: 'cuisine', label: 'Cuisine', type: 'text', required: false, placeholder: 'Primary cuisine' },
    { key: 'ingredients', label: 'Ingredients (comma separated)', type: 'tags', required: false, placeholder: 'e.g., tomato,cheese' },
    { key: 'menu_items', label: 'Menu Items (JSON)', type: 'json', required: false, placeholder: '[{"name":"Pizza","price":...}]' },
  ],
  cab: [
    { key: 'vehicle_type', label: 'Vehicle Type', type: 'text', required: true, placeholder: 'e.g., Sedan' },
    { key: 'seating_capacity', label: 'Seating Capacity', type: 'number', required: true, placeholder: 'e.g., 4' },
    { key: 'registration_number', label: 'Registration Number', type: 'text', required: false },
  ],
  guide: [
    { key: 'languages', label: 'Languages (comma separated)', type: 'tags', required: false, placeholder: 'e.g., English,Hindi' },
    { key: 'experience_years', label: 'Experience (years)', type: 'number', required: false },
    { key: 'license_id', label: 'License ID', type: 'text', required: false },
  ],
  event: [
    { key: 'scheduled_at', label: 'Scheduled At (ISO)', type: 'datetime', required: false, placeholder: '2025-12-01T10:00:00Z' },
    { key: 'capacity', label: 'Capacity', type: 'number', required: false },
    { key: 'venue_details', label: 'Venue Details (JSON)', type: 'json', required: false, placeholder: '{"name":"Hall A","address":"..."}' },
  ],
};

export default TYPE_FIELD_CONFIG;
