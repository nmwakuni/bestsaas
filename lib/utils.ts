import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in KES
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Format phone number to Kenya format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with 254
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }

  // If doesn't start with 254, add it
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }

  return cleaned;
}

/**
 * Generate unique receipt number
 */
export function generateReceiptNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `REC-${timestamp}-${random}`;
}

/**
 * Generate unique admission number
 */
export function generateAdmissionNumber(schoolCode: string, year: number): string {
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${schoolCode}/${year}/${random}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get current academic year
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  // In Kenya, academic year typically starts in January
  return year.toString();
}

/**
 * Get current term based on date
 */
export function getCurrentTerm(): number {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  // Term 1: Jan-Apr
  // Term 2: May-Aug
  // Term 3: Sep-Dec
  if (month >= 1 && month <= 4) return 1;
  if (month >= 5 && month <= 8) return 2;
  return 3;
}
