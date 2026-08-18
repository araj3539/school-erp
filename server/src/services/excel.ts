import { readSheet } from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";
import { AppError } from "../utils/errors.js";

const MAX_IMPORT_ROWS = 5000;

export interface ExcelRow {
  [key: string]: unknown;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function normalizeCellValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value;
}

export async function parseExcelFile(buffer: Buffer): Promise<ExcelRow[]> {
  const rows = await readSheet(buffer);
  if (rows.length === 0) return [];
  if (rows.length - 1 > MAX_IMPORT_ROWS) {
    throw AppError.badRequest(`Excel import exceeds the maximum of ${MAX_IMPORT_ROWS} data rows`);
  }

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((row) => {
    const result: ExcelRow = {};
    headers.forEach((header, index) => {
      if (header) result[header] = normalizeCellValue(row[index]);
    });
    return result;
  });
}

export async function generateExcelFile(data: ExcelRow[], sheetName = "Sheet1"): Promise<Buffer> {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const rows = [
    headers,
    ...data.map((item) => headers.map((header) => {
      const value = item[header];
      return value instanceof Date ? value : value ?? null;
    }))
  ];

  const buffer = await writeExcelFile(rows, { sheet: sheetName }).toBuffer();
  return Buffer.from(buffer);
}

export function validateRequiredFields(
  rows: ExcelRow[],
  requiredFields: string[]
): { valid: ExcelRow[]; errors: { row: number; message: string }[] } {
  const valid: ExcelRow[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, index) => {
    const missing = requiredFields.filter((field) => !row[field] || String(row[field]).trim() === "");
    if (missing.length > 0) {
      errors.push({ row: index + 2, message: `Missing required fields: ${missing.join(", ")}` });
    } else {
      valid.push(row);
    }
  });

  return { valid, errors };
}

export const STUDENT_IMPORT_TEMPLATE = [
  {
    admissionNo: "ADM001",
    firstName: "John",
    lastName: "Doe",
    dob: "2010-01-15",
    gender: "male",
    bloodGroup: "O+",
    religion: "Hindu",
    category: "General",
    fatherName: "Robert Doe",
    motherName: "Jane Doe",
    phone: "9876543210",
    address: "123 Main St, City",
    guardianPhone: "9876543211",
    previousSchool: "ABC School",
    admissionDate: "2024-04-01"
  }
];

export function generateStudentImportTemplate(): Promise<Buffer> {
  return generateExcelFile(STUDENT_IMPORT_TEMPLATE, "Students");
}
