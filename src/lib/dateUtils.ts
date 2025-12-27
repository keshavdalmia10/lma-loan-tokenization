import * as React from "react"

export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years" + (options?.addSuffix ? " ago" : "");
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months" + (options?.addSuffix ? " ago" : "");
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days" + (options?.addSuffix ? " ago" : "");
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours" + (options?.addSuffix ? " ago" : "");
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes" + (options?.addSuffix ? " ago" : "");
  
  return Math.floor(seconds) + " seconds" + (options?.addSuffix ? " ago" : "");
}
