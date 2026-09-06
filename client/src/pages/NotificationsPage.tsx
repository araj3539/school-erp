import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { PageLoader } from "../components/ui/Spinner";
import api, { getApiErrorMessage } from "../lib/api";

interface NotificationItem {
  _id: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
}

const priorityVariant: Record<NotificationItem["priority"], "danger" | "warning" | "info" | "secondary"> = {
  urgent: "danger", high: "warning", normal: "info", low: "secondary",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications", { params: { page: 1, limit: 50 } })).data as { data: NotificationItem[]; unread: number },
  });
  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (query.isLoading) return <PageLoader />;
  if (query.isError) return <div className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error, "Unable to load notifications.")}</div>;
  const notifications = query.data?.data ?? [];

  return (
    <main className="space-y-6 p-4 sm:p-6" aria-labelledby="notifications-heading">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Bell className="h-5 w-5" aria-hidden="true" /><h1 id="notifications-heading" className="text-2xl font-semibold">Notifications</h1></div>
          <p className="mt-1 text-sm text-slate-500">{query.data?.unread ?? 0} unread notification{(query.data?.unread ?? 0) === 1 ? "" : "s"}.</p>
        </div>
        <Button type="button" variant="secondary" disabled={!query.data?.unread || markAll.isPending} onClick={() => markAll.mutate()}>
          <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" /> Mark all read
        </Button>
      </header>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Inbox</h2></CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">You are all caught up.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {notifications.map((notification) => (
                <li key={notification._id} className={`py-4 ${notification.readAt ? "opacity-70" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-slate-900">{notification.title}</h3>
                        <Badge variant={priorityVariant[notification.priority]}>{notification.priority}</Badge>
                        {!notification.readAt && <span className="text-xs font-medium text-primary-600">New</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      <p className="mt-2 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    {!notification.readAt && <Button type="button" variant="ghost" onClick={() => markRead.mutate(notification._id)} disabled={markRead.isPending}>Mark read</Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
