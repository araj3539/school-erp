import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "School ERP";
const PAGE_TITLES: Array<[RegExp, string]> = [
  [/^\/login$/, "Sign In"],
  [/^\/dashboard$/, "Dashboard"],
  [/^\/students$/, "Students"],
  [/^\/students\/bulk$/, "Student Import & Export"],
  [/^\/students\/[^/]+\/document-recovery$/, "Student Document Recovery"],
  [/^\/students\/[^/]+$/, "Student Details"],
  [/^\/document-recovery$/, "Document Recovery"],
  [/^\/teachers$/, "Teachers"],
  [/^\/classes$/, "Classes & Sections"],
  [/^\/attendance$/, "Attendance"],
  [/^\/exams$/, "Exams & Results"],
  [/^\/fees$/, "Fees"],
  [/^\/reports$/, "Reports"],
  [/^\/settings$/, "Settings"]
];
export function getPageTitle(pathname: string): string | null {
  const match = PAGE_TITLES.find(([pattern]) => pattern.test(pathname));
  return match ? match[1] : null;
}
export function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = getPageTitle(pathname);
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [pathname]);
}
