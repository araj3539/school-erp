import { Outlet } from "react-router-dom";
import { cn } from "../utils";
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {" "}
      <div className="w-full max-w-md">
        {" "}
        <div className="text-center mb-8">
          {" "}
          <h1 className="text-3xl font-bold text-primary-600">
            School ERP
          </h1>{" "}
          <p className="text-gray-500 mt-2">Sign in to your account</p>{" "}
        </div>{" "}
        <div className="card p-6">
          {" "}
          <Outlet />{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
