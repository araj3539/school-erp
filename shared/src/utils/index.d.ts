export declare function formatCurrency(amount: number, currency?: string): string;
export declare function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string;
export declare function formatDateTime(date: string | Date): string;
export declare function generateReceiptNumber(prefix?: string): string;
export declare function generateAdmissionNumber(prefix?: string): string;
export declare function generateEmployeeId(prefix?: string): string;
export declare function calculateAge(dob: string | Date): number;
export declare function getAcademicYearLabel(startYear: number): string;
export declare function getCurrentAcademicYear(): {
    startYear: number;
    label: string;
};
export declare function slugify(text: string): string;
export declare function truncate(text: string, length: number): string;
export declare function className(...classes: (string | boolean | undefined | null)[]): string;
//# sourceMappingURL=index.d.ts.map
