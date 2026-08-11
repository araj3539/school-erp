import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { cn } from "../utils";
export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {" "}
      <Sidebar />{" "}
      <div className={cn("transition-all duration-200", "lg:pl-64")}>
        {" "}
        <Header />{" "}
        <main className="p-4 lg:p-6">
          {" "}
          <Outlet />{" "}
        </main>{" "}
      </div>{" "}
    </div>
  );
}
