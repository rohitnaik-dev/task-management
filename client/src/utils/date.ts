/**
 * Shared date formatting utilities.
 *
 * Ensures all user-visible dates across the application are displayed
 * consistently in DD/MM/YYYY format (and DD/MM/YYYY HH:mm for timestamps with time).
 */

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Formats a date or timestamp value into DD/MM/YYYY format.
 *
 * - Date-only strings (YYYY-MM-DD) are parsed without timezone conversion to prevent day shifts.
 * - ISO timestamps and Date objects use the user's local calendar day.
 * - Null, undefined, empty, and invalid dates safely return the provided fallback (default "—").
 *
 * @example
 * formatDate("2026-10-21") // "21/10/2026"
 * formatDate("2026-10-21T14:30:00Z") // "21/10/2026"
 * formatDate(null) // "—"
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  // Handle date-only strings (e.g. "2026-10-21") without timezone conversion
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    const match = DATE_ONLY_REGEX.exec(trimmed);
    if (match) {
      const [, year, month, day] = match;
      const y = Number(year);
      const m = Number(month);
      const d = Number(day);

      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 0) {
        return `${day}/${month}/${year}`;
      }
      return fallback;
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
}

/**
 * Formats a date or timestamp value into DD/MM/YYYY HH:mm (24-hour time format).
 *
 * - Null, undefined, empty, and invalid dates safely return the provided fallback (default "—").
 *
 * @example
 * formatDateTime("2026-10-21T14:30:00") // "21/10/2026 14:30"
 * formatDateTime(null) // "—"
 */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    const match = DATE_ONLY_REGEX.exec(trimmed);
    if (match) {
      const [, year, month, day] = match;
      const y = Number(year);
      const m = Number(month);
      const d = Number(day);

      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 0) {
        return `${day}/${month}/${year} 00:00`;
      }
      return fallback;
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
