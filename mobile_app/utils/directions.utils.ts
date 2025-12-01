export const goDirectionOnMaps = (place: any) => {
  const lat = place.latitude;
  const lng = place.longitude;
  const name = encodeURIComponent(place.name);

  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;
};
