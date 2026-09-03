import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", ...options });
}
export function formatDateTime(date: string | Date): string { return formatDate(date, { hour: "2-digit", minute: "2-digit" }); }
export function truncate(text: string, length: number): string { return text.length <= length ? text : text.slice(0, length).trim() + "..."; }
function pad(value: number) { return String(value).padStart(2, "0"); }
export function toIsoDateTime(dateOnly: string): string {
  const date = new Date(`${dateOnly}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateOnly : date.toISOString();
}
export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function todayDateInputValue(): string { return toDateInputValue(new Date()); }
