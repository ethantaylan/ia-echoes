/**
 * Timestamp formatting utilities
 * Formats timestamps relative to current time (e.g., "5m ago", "2h ago")
 */

/**
 * Format a timestamp to relative time
 * @param timestamp - ISO timestamp string or Date object
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Just now (< 1 minute)
  if (diffInSeconds < 60) return 'Just now';

  // Minutes ago
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  // Hours ago
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  // Days ago
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  // Fallback to date string
  return date.toLocaleDateString();
}

/**
 * Get the next update interval for a timestamp
 * Returns milliseconds until the next meaningful change in relative time
 * @param timestamp - ISO timestamp string or Date object
 * @returns Milliseconds until next update needed
 */
export function getNextUpdateInterval(timestamp: string | Date): number {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Update every 10 seconds for "Just now"
  if (diffInSeconds < 60) return 10000;

  // Update every minute for "Xm ago"
  if (diffInSeconds < 3600) return 60000;

  // Update every 5 minutes for "Xh ago"
  if (diffInSeconds < 86400) return 300000;

  // Update every hour for older messages
  return 3600000;
}
