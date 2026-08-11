"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.generateReceiptNumber = generateReceiptNumber;
exports.generateAdmissionNumber = generateAdmissionNumber;
exports.generateEmployeeId = generateEmployeeId;
exports.calculateAge = calculateAge;
exports.getAcademicYearLabel = getAcademicYearLabel;
exports.getCurrentAcademicYear = getCurrentAcademicYear;
exports.slugify = slugify;
exports.truncate = truncate;
exports.className = className;
function formatCurrency(amount, currency = "INR") { return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount); }
function formatDate(date, options) { const d = new Date(date); return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", ...options }); }
function formatDateTime(date) { return formatDate(date, { hour: "2-digit", minute: "2-digit" }); }
function generateReceiptNumber(prefix = "RCPT") { const timestamp = Date.now().toString(36).toUpperCase(); const random = Math.random().toString(36).substring(2, 6).toUpperCase(); return `${prefix}-${timestamp}-${random}`; }
function generateAdmissionNumber(prefix = "ADM") { const year = new Date().getFullYear().toString().slice(-2); const timestamp = Date.now().toString(36).toUpperCase(); return `${prefix}${year}${timestamp}`; }
function generateEmployeeId(prefix = "EMP") { const timestamp = Date.now().toString(36).toUpperCase(); return `${prefix}-${timestamp}`; }
function calculateAge(dob) { const today = new Date(); const birth = new Date(dob); let age = today.getFullYear() - birth.getFullYear(); const monthDiff = today.getMonth() - birth.getMonth(); if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
} return age; }
function getAcademicYearLabel(startYear) { return `${startYear}-${(startYear + 1).toString().slice(-2)}`; }
function getCurrentAcademicYear() { const now = new Date(); const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; return { startYear, label: getAcademicYearLabel(startYear) }; }
function slugify(text) { return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, ""); }
function truncate(text, length) { if (text.length <= length)
    return text; return text.slice(0, length).trim() + "..."; }
function className(...classes) { return classes.filter(Boolean).join(" "); }
