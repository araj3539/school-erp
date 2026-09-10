import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";

function describeError(error: unknown): { title: string; description: string } {
  if (isRouteErrorResponse(error)) return { title: `${error.status} ${error.statusText}`.trim(), description: error.data?.message || "The page could not be loaded." };
  if (error instanceof Error) return { title: "Something went wrong", description: error.message };
  return { title: "Something went wrong", description: "An unexpected error occurred." };
}

export default function RouteErrorPage() {
  const error = useRouteError();
  const { title, description } = describeError(error);
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-5">
      <main role="alert" className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Page unavailable</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{title}</h1>
        <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
          <Link to="/dashboard" className="btn-primary"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Go to dashboard</Link>
        </div>
      </main>
    </div>
  );
}
