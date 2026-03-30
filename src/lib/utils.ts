import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

export function formatResponseTime(ms: number): string {
  if (ms < MS_PER_HOUR) {
    const minutes = Math.round(ms / MS_PER_MINUTE);
    return `${Math.max(minutes, 1)}m`;
  }
  if (ms < MS_PER_DAY) {
    const hours = Math.round((ms / MS_PER_HOUR) * 10) / 10;
    return `${hours}h`;
  }
  const days = Math.round((ms / MS_PER_DAY) * 10) / 10;
  return `${days}d`;
}
