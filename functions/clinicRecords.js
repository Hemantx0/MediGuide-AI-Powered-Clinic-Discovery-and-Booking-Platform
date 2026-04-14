function normalizeIdPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatCoordinateForId(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed.toFixed(5) : "na";
}

function buildStableClinicId({ source, providerId, lat, lng }) {
  const normalizedSource = normalizeIdPart(source) || "unknown";
  const normalizedProviderId = normalizeIdPart(providerId);
  if (normalizedProviderId) {
    return `${normalizedSource}_${normalizedProviderId}`;
  }

  return `${normalizedSource}_${formatCoordinateForId(lat)}_${formatCoordinateForId(lng)}`;
}

function normalizeClinicRecord(clinic, context = {}) {
  if (!clinic || typeof clinic !== "object") {
    return null;
  }

  const source = String(clinic.source || context.source || "unknown").trim().toLowerCase() || "unknown";
  const lat = Number.parseFloat(clinic.lat ?? clinic.latitude);
  const lng = Number.parseFloat(clinic.lng ?? clinic.longitude);
  const clinicId = String(
    clinic.clinicId || buildStableClinicId({
      source,
      providerId: clinic.providerId || clinic.placeId || clinic.id || clinic.osmId,
      lat,
      lng
    })
  ).trim();

  return {
    clinicId,
    source,
    name: String(clinic.name || "Clinic").trim(),
    address: String(clinic.address || "").trim(),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    mapsUrl: String(clinic.mapsUrl || "").trim(),
    specialtyMatched: String(clinic.specialtyMatched || context.specialtyMatched || "").trim(),
    searchContext: String(clinic.searchContext || context.searchContext || "").trim(),
    phone: String(clinic.phone || "").trim(),
    providerId: String(clinic.providerId || clinic.placeId || clinic.id || "").trim(),
    providerType: String(clinic.providerType || "").trim()
  };
}

module.exports = {
  buildStableClinicId,
  normalizeClinicRecord
};
