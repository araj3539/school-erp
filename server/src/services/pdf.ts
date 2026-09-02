import PDFDocument from "pdfkit";
import { formatCurrency, formatDate } from "@school-erp/shared";

import type { Student, Fee, Payment, Teacher } from "@school-erp/shared";

export interface ReceiptSchoolBranding {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export function getReceiptSchoolBranding(school: ReceiptSchoolBranding): string[] {
  return [school.name, school.address, `Phone: ${school.phone}`, `Email: ${school.email}`];
}

export function getReceiptFilename(receiptNo: string): string {
  const safeReceiptNo = receiptNo.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `receipt-${safeReceiptNo}.pdf`;
}

export function generateReceiptPDF(payment: Payment & { fee: Fee & { student: Student; feeStructure: { feeType: string; amount: number } }; collectedBy: { fullName: string }; school: ReceiptSchoolBranding }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").text("FEE RECEIPT", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).font("Helvetica").text(`Receipt No: ${payment.receiptNo}`, { align: "right" });
    doc.text(`Date: ${formatDate(payment.date)}`, { align: "right" });
    doc.moveDown(2);

    const [schoolName, schoolAddress, schoolPhone, schoolEmail] = getReceiptSchoolBranding(payment.school);
    doc.fontSize(14).font("Helvetica-Bold").text(schoolName, { align: "center" });
    doc.fontSize(10).font("Helvetica").text(schoolAddress, { align: "center" });
    doc.text(schoolPhone, { align: "center" });
    doc.text(schoolEmail, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).font("Helvetica-Bold").text("Student Details");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    const student = payment.fee.student;
    doc.text(`Name: ${student.firstName} ${student.lastName}`);
    doc.text(`Admission No: ${student.admissionNo}`);
    doc.text(`Class: ${student.classId} - ${student.sectionId}`);
    doc.moveDown(2);

    doc.fontSize(12).font("Helvetica-Bold").text("Fee Details");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    const feeStructure = payment.fee.feeStructure;
    doc.text(`Fee Type: ${feeStructure.feeType}`);
    doc.text(`Amount: ${formatCurrency(feeStructure.amount)}`);
    doc.text(`Discount: ${formatCurrency(payment.fee.discount)}`);
    doc.text(`Fine: ${formatCurrency(payment.fee.fine)}`);
    doc.text(`Total Due: ${formatCurrency(payment.fee.totalDue)}`);
    doc.moveDown();
    doc.font("Helvetica-Bold").text(`Amount Paid: ${formatCurrency(payment.amount)}`);
    doc.font("Helvetica").text(`Mode: ${payment.mode}`);
    if (payment.transactionId) doc.text(`Transaction ID: ${payment.transactionId}`);
    doc.moveDown(2);

    doc.fontSize(10).font("Helvetica");
    doc.text("Collected By: " + payment.collectedBy.fullName);
    doc.moveDown(2);
    doc.text("Authorized Signature", { align: "right" });
    doc.end();
  });
}

export function generateIDCardPDF(student: Student & { classId: { displayName: string }; sectionId: { name: string } }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 20, size: [300, 200] });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.rect(10, 10, 280, 180).stroke();
    doc.fontSize(14).font("Helvetica-Bold").text("School Name", 20, 20, { width: 260, align: "center" });
    doc.rect(20, 50, 80, 100).stroke();
    doc.fontSize(8).text("PHOTO", 20, 90, { width: 80, align: "center" });
    let y = 50;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Name: ${student.firstName} ${student.lastName}`, 110, y); y += 20;
    doc.text(`Admission No: ${student.admissionNo}`, 110, y); y += 20;
    doc.text(`Class: ${student.classId.displayName} - ${student.sectionId.name}`, 110, y); y += 20;
    doc.text(`DOB: ${formatDate(student.dob)}`, 110, y); y += 20;
    doc.text(`Blood Group: ${student.bloodGroup || "N/A"}`, 110, y); y += 20;
    doc.text(`Phone: ${student.phone}`, 110, y);
    doc.rect(200, 50, 80, 40).stroke();
    doc.fontSize(8).text("QR CODE", 200, 65, { width: 80, align: "center" });
    doc.end();
  });
}

export function generateTeacherIDCardPDF(teacher: Teacher): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 20, size: [300, 200] });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.rect(10, 10, 280, 180).stroke();
    doc.fontSize(14).font("Helvetica-Bold").text("School Name", 20, 20, { width: 260, align: "center" });
    doc.rect(20, 50, 80, 100).stroke();
    doc.fontSize(8).text("PHOTO", 20, 90, { width: 80, align: "center" });
    let y = 50;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Name: ${teacher.firstName} ${teacher.lastName}`, 110, y); y += 20;
    doc.text(`Employee ID: ${teacher.employeeId}`, 110, y); y += 20;
    doc.text(`Qualification: ${teacher.qualification}`, 110, y); y += 20;
    doc.text(`Phone: ${teacher.phone}`, 110, y); y += 20;
    doc.text(`Joining: ${formatDate(teacher.joiningDate)}`, 110, y);
    doc.rect(200, 50, 80, 40).stroke();
    doc.fontSize(8).text("QR CODE", 200, 65, { width: 80, align: "center" });
    doc.end();
  });
}
