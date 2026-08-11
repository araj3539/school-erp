import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { Table } from "../components/ui/Table";
import { Download, DollarSign, Calendar, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { formatCurrency, formatDate } from "../utils";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("profile");

  const { data: student } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const res = await api.get(`/students/${id}`);
      return res.data;
    },
    enabled: !!id
  });
  const { data: feesData } = useQuery({
    queryKey: ["fees", "student", id],
    queryFn: async () => {
      const res = await api.get(`/fees/student/${id}`);
      return res.data;
    },
    enabled: !!id
  });
  const { data: attendanceData } = useQuery({
    queryKey: ["attendance", "student", id],
    queryFn: async () => {
      const res = await api.get(`/attendance/student/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  const statusBadges: Record<string, "success" | "warning" | "danger" | "info"> = {
    active: "success",
    left: "danger",
    graduated: "info",
    transferred: "warning"
  };

  if (!student?.student) return <div className="text-center py-8">Loading...</div>;

  const s = student.student;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/students" className="btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/api/students/${id}/id-card`, "_blank")}>
            <Download className="w-4 h-4 mr-2" />
            ID Card
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{s.firstName} {s.lastName}</h1>
              <p className="text-gray-500 mt-1">Admission No: {s.admissionNo}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <span>Class: {s.classId?.displayName} - {s.sectionId?.name}</span>
                <span>Gender: {s.gender}</span>
                <span>DOB: {formatDate(s.dob)} (Age: {Math.floor((Date.now() - new Date(s.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))})</span>
                <span>Blood Group: {s.bloodGroup || "N/A"}</span>
                <span>Phone: {s.phone}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant={statusBadges[s.status] || "default"}>{s.status}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="fees"><DollarSign className="w-4 h-4 mr-2" />Fees</TabsTrigger>
          <TabsTrigger value="attendance"><Calendar className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><h3 className="text-lg font-semibold">Personal Details</h3></CardHeader>
              <CardContent className="space-y-3">
                <p><strong>Father&apos;s Name:</strong> {s.fatherName}</p>
                <p><strong>Mother&apos;s Name:</strong> {s.motherName}</p>
                <p><strong>Guardian Phone:</strong> {s.guardianPhone || "N/A"}</p>
                <p><strong>Religion:</strong> {s.religion || "N/A"}</p>
                <p><strong>Category:</strong> {s.category || "N/A"}</p>
                <p><strong>Previous School:</strong> {s.previousSchool || "N/A"}</p>
                <p><strong>Address:</strong> {s.address}</p>
                <p><strong>Admission Date:</strong> {formatDate(s.admissionDate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><h3 className="text-lg font-semibold">Documents</h3></CardHeader>
              <CardContent>
                {s.documents?.length > 0 ? (
                  <ul className="space-y-2">
                    {s.documents.map((doc: any) => (
                      <li key={doc.type} className="flex items-center justify-between">
                        <span className="capitalize">{doc.type.replace("_", " ")}</span>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">View</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No documents uploaded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="fees">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Fee Records</h3>
              <div className="flex gap-2">
                <span className="text-sm font-medium text-green-600">Total Due: {formatCurrency(feesData?.summary?.totalDue || 0)}</span>
                <span className="text-sm font-medium text-blue-600">Paid: {formatCurrency(feesData?.summary?.paid || 0)}</span>
                <span className="text-sm font-medium text-red-600">Balance: {formatCurrency(feesData?.summary?.balance || 0)}</span>
              </div>
            </CardHeader>
            <CardContent>
              {feesData?.fees?.length > 0 ? (
                <Table
                  data={feesData.fees}
                  columns={[
                    { key: "feeStructureId", header: "Fee Type", render: (f: any) => f.feeStructureId?.feeType },
                    { key: "totalDue", header: "Total Due", render: (f: any) => formatCurrency(f.totalDue) },
                    { key: "paidAmount", header: "Paid", render: (f: any) => formatCurrency(f.paidAmount) },
                    { key: "balance", header: "Balance", render: (f: any) => formatCurrency(f.balance) },
                    { key: "status", header: "Status", render: (f: any) => <Badge variant={f.status === "paid" ? "success" : f.status === "overdue" ? "danger" : "warning"}>{f.status}</Badge> }
                  ]}
                  keyExtractor={(f) => f._id}
                  emptyMessage="No fee records"
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No fee records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Attendance Records</h3>
              <div className="flex gap-4 text-sm">
                <span className="font-medium text-green-600">Present: {attendanceData?.summary?.present || 0}</span>
                <span className="font-medium text-red-600">Absent: {attendanceData?.summary?.absent || 0}</span>
                <span className="font-medium text-yellow-600">Late: {attendanceData?.summary?.late || 0}</span>
                <span className="font-medium text-blue-600">Half Day: {attendanceData?.summary?.halfDay || 0}</span>
                <span className="font-medium text-gray-600">On Leave: {attendanceData?.summary?.onLeave || 0}</span>
              </div>
            </CardHeader>
            <CardContent>
              {attendanceData?.attendance?.length > 0 ? (
                <Table
                  data={attendanceData.attendance}
                  columns={[
                    { key: "date", header: "Date", render: (a: any) => formatDate(a.date) },
                    { key: "status", header: "Status", render: (a: any) => {
                      const record = a.records?.find((r: any) => r.studentId === id);
                      return record ? <Badge variant={record.status === "present" ? "success" : record.status === "absent" ? "danger" : record.status === "late" ? "warning" : "info"}>{record.status}</Badge> : "-";
                    } },
                    { key: "remark", header: "Remark", render: (a: any) => {
                      const record = a.records?.find((r: any) => r.studentId === id);
                      return record?.remark || "-";
                    } }
                  ]}
                  keyExtractor={(a) => a._id}
                  emptyMessage="No attendance records"
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No attendance records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
