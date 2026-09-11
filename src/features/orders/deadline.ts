const KYIV_TIME_ZONE = "Europe/Kyiv";
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * Reads a `datetime-local` wall clock in Europe/Kyiv and returns the UTC Date.
 * Invalid calendars and out-of-range hours return null.
 */
export function parseKyivDateTime(value: string): Date | null {
  const match = LOCAL_DATE_TIME.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = kyivOffsetMs(utcGuess);
  const instant = new Date(utcGuess - offset);

  if (Number.isNaN(instant.getTime())) {
    return null;
  }

  return instant;
}

function kyivOffsetMs(utcMs: number) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: KYIV_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(utcMs))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );

  return asUtc - utcMs;
}
