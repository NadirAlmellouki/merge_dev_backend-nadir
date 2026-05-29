import ApiError from "../utils/ApiError.js";

const isValidLatitude = (value) => typeof value === "number" && value >= -90 && value <= 90;
const isValidLongitude = (value) => typeof value === "number" && value >= -180 && value <= 180;

export const validateCreateSession = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw ApiError.badRequest("Session payload must be an object");
  }

  const subject = String(payload.subject || "").trim();
  if (!subject) {
    throw ApiError.badRequest("subject is required");
  }

  const startTime = payload.start_time ? new Date(payload.start_time) : null;
  if (!startTime || Number.isNaN(startTime.getTime())) {
    throw ApiError.badRequest("start_time is required and must be a valid date");
  }
  if (startTime <= new Date()) {
    throw ApiError.badRequest("start_time must be in the future");
  }

  const duration_minutes = payload.duration_minutes == null
    ? 60
    : Number(payload.duration_minutes);
  if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) {
    throw ApiError.badRequest("duration_minutes must be a positive integer");
  }

  const max_participants = Number(payload.max_participants);
  if (!Number.isInteger(max_participants) || max_participants < 2 || max_participants > 20) {
    throw ApiError.badRequest("max_participants must be an integer between 2 and 20");
  }

  const latitude = payload.latitude == null ? null : Number(payload.latitude);
  const longitude = payload.longitude == null ? null : Number(payload.longitude);
  if ((latitude != null && longitude == null) || (latitude == null && longitude != null)) {
    throw ApiError.badRequest("Both latitude and longitude must be provided together");
  }

  if (latitude != null && !isValidLatitude(latitude)) {
    throw ApiError.badRequest("latitude must be a valid coordinate between -90 and 90");
  }
  if (longitude != null && !isValidLongitude(longitude)) {
    throw ApiError.badRequest("longitude must be a valid coordinate between -180 and 180");
  }

  return {
    subject,
    topic: payload.topic ? String(payload.topic).trim() : null,
    location_name: payload.location_name ? String(payload.location_name).trim() : null,
    start_time: startTime.toISOString(),
    duration_minutes,
    max_participants,
    latitude,
    longitude,
  };
};
