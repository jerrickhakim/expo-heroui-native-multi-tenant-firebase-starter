import dayjs from "dayjs";

/**
 * Formats a timestamp (Firestore timestamp or Date) into a readable date string
 * @param timestamp - Can be a Date object, Firestore timestamp with toDate(), or object with _seconds/seconds
 * @returns Formatted date string in "MMMM D, YYYY" format or "Unknown" if invalid
 */
export const formatDate = (timestamp: any): string => {
  if (!timestamp) return "Unknown";

  let date: dayjs.Dayjs;

  if (timestamp instanceof Date) {
    date = dayjs(timestamp);
  } else if (typeof timestamp === "object" && "toDate" in timestamp && typeof timestamp.toDate === "function") {
    date = dayjs(timestamp.toDate());
  } else if (typeof timestamp === "object") {
    // Handle both _seconds (from API) and seconds (Firestore SDK) formats
    const seconds = timestamp._seconds ?? timestamp.seconds;
    if (typeof seconds === "number") {
      date = dayjs(seconds * 1000);
    } else {
      return "Unknown";
    }
  } else {
    return "Unknown";
  }

  if (!date.isValid()) return "Unknown";

  return date.format("MMMM D, YYYY");
};
