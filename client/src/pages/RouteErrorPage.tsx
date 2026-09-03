import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/Button";

function describeError(error: unknown): { title: string; description: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`.trim(),
      description: error.data?.message || "The page could not be loaded."
    };
  }
  if (error instanceof Error) {
    return { title: "Something went wrong", description: error.message };
  }
  return { title: "Something went wrong", description: "An unexpected error occurred." };
}

export default function RouteErrorPage() {
  const error = useRouteError();
  const { title, description } = describeError(error);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div role="alert" className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 break-words text-sm text-gray-500">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
