import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PremiumCard, PremiumCardHeader, PremiumCardContent, PremiumCardFooter } from "../components/ui/PremiumCard.js";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { formatCurrency } from "../utils/index.js";
import { useFees } from "../hooks/useFees.js";
import { PaymentMode } from "@school-erp/shared";
import { GlassPanel, GlowOrb } from "../components/ui/GlassPanel.js";
import { WalletCards, DollarSign, Download, FileText, Plus, RefreshCw, Search, ReceiptText } from "lucide-react";

type FeeRecord = { _id: string; studentId?: { firstName?: string; lastName?: string; admissionNo?: string; classId?: { displayName?: string }; sectionId?: { name?: string } }; feeStructureId?: { feeType?: string }; amount: number; paidAmount: number; balance: number; status: string; dueDate: string; academicYear: string };

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("register");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);

  const { fees, pagination, isLoading, isError, refetch } = useFees({ limit: 20, search, status: statusFilter || undefined });
  const totalPages = pagination?.totalPages || 1;

  const feeRows = fees as unknown as FeeRecord[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/50 relative overflow-x-hidden pb-12">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <GlowOrb color="amber" size="xl" className="top-[-5%] left-[-10%] animate-pulse-slow" />
        <GlowOrb color="primary" size="lg" className="bottom-[-10%] right-[-10%] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <GlassPanel className="mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30">
                    <DollarSign className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fee Management</h1>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">Track collections, record payments, and manage defaulters from one elegant workspace.</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button onClick={() => setStructureModalOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 text-sm font-semibold rounded-2xl transition-all">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add Structure
                </Button>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          <PremiumCard gradient className="p-5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <WalletCards className="h-12 w-12 text-amber-500" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">Total Due</p>
            <p className="text-2xl font-black text-slate-900">{isLoading ? "—" : formatCurrency(feeRows.reduce((sum, f) => sum + f.amount, 0))}</p>
          </PremiumCard>
          <PremiumCard gradient className="p-5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="h-12 w-12 text-emerald-500" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">Total Collected</p>
            <p className="text-2xl font-black text-slate-900">{isLoading ? "—" : formatCurrency(feeRows.reduce((sum, f) => sum + f.paidAmount, 0))}</p>
          </PremiumCard>
          <PremiumCard gradient className="p-5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ReceiptText className="h-12 w-12 text-rose-500" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">Outstanding</p>
            <p className="text-2xl font-black text-rose-600">{isLoading ? "—" : formatCurrency(feeRows.reduce((sum, f) => sum + f.balance, 0))}</p>
          </PremiumCard>
          <PremiumCard gradient className="p-5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="h-12 w-12 text-slate-500" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">Overdue</p>
            <p className="text-2xl font-black text-slate-900">{isLoading ? "—" : feeRows.filter(f => f.status === "overdue").length}</p>
          </PremiumCard>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden">
            <TabsTrigger value="register">Fee Register</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <PremiumCard hover className="overflow-hidden">
              <PremiumCardHeader className="border-b border-slate-100/60 bg-white/80 pb-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="relative min-w-0">
                      <Input aria-label="Search fees" placeholder="Search by student name or admission number…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} className="w-full" />
                    </div>
                    <Select aria-label="Filter by fee status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full md:w-48 md:shrink-0">
                      <option value="">All statuses</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="overdue">Overdue</option>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="text-slate-600 hover:text-primary-600 hover:border-primary-200">
                      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
                    </Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" aria-hidden="true" /> Export</Button>
                  </div>
                </div>
              </PremiumCardHeader>
              <PremiumCardContent className="p-0">
                {isError ? (
                  <div className="px-6 py-16 text-center">
                    <div className="flex justify-center mb-4">
                      <RefreshCw className="h-12 w-12 text-red-500 animate-spin" aria-hidden="true" />
                    </div>
                    <p className="mt-3 font-medium text-slate-900">Unable to load fees</p>
                    <p className="mt-1 text-sm text-slate-500">Please check your permissions or connection and try again.</p>
                    <Button className="mt-6" variant="outline" onClick={() => refetch()}>Try again</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data={feeRows} columns={[] as any} keyExtractor={(f: FeeRecord) => f._id} emptyMessage="No fees found" isLoading={isLoading} />
                  </div>
                )}
                {(feeRows.length > 0 && !isLoading) && (
                  <PremiumCardFooter className="border-t border-slate-100/60 bg-white/80">
                    <div className="flex items-center justify-between px-0">
                      <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                      </div>
                    </div>
                  </PremiumCardFooter>
                )}
              </PremiumCardContent>
            </PremiumCard>
          </TabsContent>

          <TabsContent value="payments">
            <PremiumCard hover className="h-full">
              <PremiumCardContent className="p-12">
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-8 py-16 text-center">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Payment History</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">Payment records will appear here once fee payments are processed.</p>
                </div>
              </PremiumCardContent>
            </PremiumCard>
          </TabsContent>
        </Tabs>

        {/* Create Fee Structure Modal */}
        <Modal isOpen={structureModalOpen} onClose={() => setStructureModalOpen(false)} title="Create Fee Structure" size="lg">
          <div className="space-y-6 p-6">
            <p className="text-sm text-slate-600">Fee structure creation will be available when the finance module is fully integrated.</p>
            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setStructureModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>

        {/* Record Payment Modal */}
        <Modal isOpen={paymentModalOpen} onClose={() => { setPaymentModalOpen(false); setSelectedFeeId(null); }} title="Record Payment" size="md">
          <form className="space-y-6 p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-600">Recording payment for fee #{selectedFeeId?.slice(-6)}</p>
            </div>
            <Input label="Amount" placeholder="0.00" />
            <Select label="Payment mode">
              <option value={PaymentMode.CASH}>Cash</option>
              <option value={PaymentMode.UPI}>UPI</option>
              <option value={PaymentMode.CARD}>Card</option>
              <option value={PaymentMode.BANK_TRANSFER}>Bank Transfer</option>
              <option value={PaymentMode.CHEQUE}>Cheque</option>
              <option value={PaymentMode.ONLINE}>Online</option>
            </Select>
            <Input label="Transaction ID (optional)" placeholder="Enter transaction reference" />
            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={() => { setPaymentModalOpen(false); setSelectedFeeId(null); }}>Cancel</Button>
              <Button type="submit" className="bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40">Record Payment</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
