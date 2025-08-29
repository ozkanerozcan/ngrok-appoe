// Duration formatting utilities
// Converts between HH:MM display format and decimal storage format

/**
 * Convert decimal hours to English format (hours/minutes)
 * @param {number} decimalHours - Duration in decimal format (e.g., 2.5)
 * @returns {string} - Formatted string in English (e.g., "2 hours 30 minutes")
 */
export const formatDurationEnglish = (decimalHours) => {
  if (!decimalHours || decimalHours === 0) return "0m";

  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

/**
 * Convert HH:MM format to decimal hours
 * @param {string} timeString - Time in HH:MM format (e.g., "2:30")
 * @returns {number} - Duration in decimal format (e.g., 2.5)
 */
export const timeStringToDecimal = (timeString) => {
  if (!timeString || !timeString.includes(":")) return 0;

  const [hours, minutes] = timeString.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) return 0;

  return hours + minutes / 60;
};

/**
 * Convert decimal hours to HH:MM format
 * @param {number} decimalHours - Duration in decimal format (e.g., 2.5)
 * @returns {string} - Time in HH:MM format (e.g., "2:30")
 */
export const decimalToTimeString = (decimalHours) => {
  if (!decimalHours || decimalHours === 0) return "0:00";

  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};

/**
 * Validate HH:MM time format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} - True if valid HH:MM format
 */
export const isValidTimeFormat = (timeString) => {
  if (!timeString || typeof timeString !== "string") return false;

  const timeRegex = /^(\d{1,2}):([0-5]\d)$/;
  const match = timeString.match(timeRegex);

  if (!match) return false;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

/**
 * Format duration for display (legacy function for backward compatibility)
 * @param {number} hours - Duration in decimal format
 * @returns {string} - Formatted duration string
 */
export const formatDuration = (hours) => {
  return formatDurationEnglish(hours);
};
