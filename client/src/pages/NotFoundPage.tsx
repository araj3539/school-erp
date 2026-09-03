import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <SearchX className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Page not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            The page you are looking for does not exist or may have been moved.
          </p>
          <Link to="/dashboard" className="btn-primary mt-6">Go to Dashboard</Link>
        </CardContent>
      </Card>
    </div>
  );
}
