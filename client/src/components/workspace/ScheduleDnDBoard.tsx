import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CalendarClock, MapPin, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";

type Props = { loading?: boolean; grouped: Array<{ name: string; day: number; entries: any[] }>; enabled: boolean; onMove: (entry: any, day: number) => void; onEdit: (entry: any) => void; onDelete: (entry: any) => void };

function DropDay({ day, children }: { day: { name: string; day: number }; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.day}` });
  return <div ref={setNodeRef} className={`min-h-44 rounded-[20px] transition-colors ${isOver ? "bg-primary-50 ring-2 ring-primary-200" : ""}`}>{children}</div>;
}

function DragEntry({ item, enabled, onEdit, onDelete }: { item: any; enabled: boolean; onEdit: (item: any) => void; onDelete: (item: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item._id, disabled: !enabled });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.03 : 1}) rotate(${isDragging ? 1.5 : 0}deg)`, zIndex: isDragging ? 40 : undefined } : undefined;
  return <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`rounded-2xl border bg-white p-4 shadow-sm transition-[border-color,box-shadow] ${isDragging ? "border-primary-300 shadow-xl" : "border-slate-200 hover:border-slate-300"}`}>
    <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-extrabold tabular-nums text-slate-950">{item.startTime}?{item.endTime}</p><p className="mt-1 text-sm font-bold text-primary-700">{item.subjectId?.name || "Subject"}</p></div>{enabled && <div className="flex gap-1"><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onEdit(item)} className="rounded-lg px-2 py-1 text-xs font-bold text-primary-700 hover:bg-primary-50">Edit</button><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onDelete(item)} className="rounded-lg px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50">Delete</button></div>}</div>
    <div className="mt-3 space-y-1 text-xs text-slate-500"><p className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />{item.teacherId ? `${item.teacherId.firstName} ${item.teacherId.lastName}` : "Teacher not assigned"}</p><p className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />{item.classId?.displayName || "Class"}{item.sectionId?.name ? ` ? ${item.sectionId.name}` : ""}</p>{item.roomNumber && <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Room {item.roomNumber}</p>}</div>
  </div>;
}

export function ScheduleDnDBoard({ grouped, loading = false, enabled, onMove, onEdit, onDelete }: Props) {
  const [pulseDay, setPulseDay] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || !enabled) return;
    const target = Number(String(event.over.id).replace("day-", ""));
    const item = grouped.flatMap((day) => day.entries).find((entry) => entry._id === event.active.id);
    if (!item || !target || target === item.dayOfWeek) return;
    setPulseDay(target);
    window.setTimeout(() => setPulseDay(null), 280);
    onMove(item, target);
  };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}><div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{grouped.map((day) => <Card key={day.name} className={`overflow-hidden ${pulseDay === day.day ? "ring-2 ring-primary-200" : ""}`}><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600">Day {day.day}</p><h2 className="mt-1 text-lg font-bold text-slate-950">{day.name}</h2></div><Badge variant="info">{day.entries.length} {day.entries.length === 1 ? "period" : "periods"}</Badge></div></CardHeader><CardContent><DropDay day={day}>{loading ? <div className="space-y-3"><div className="h-28 animate-pulse rounded-2xl bg-slate-100" /><div className="h-20 animate-pulse rounded-2xl bg-slate-100" /></div> : day.entries.length === 0 ? <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 text-center"><CalendarClock className="h-8 w-8 text-slate-300" /><p className="mt-2 font-semibold text-slate-700">Drop a period here</p><p className="mt-1 text-sm text-slate-500">Drag a schedule card from another day.</p></div> : <div className="space-y-3">{day.entries.map((item) => <DragEntry key={item._id} item={item} enabled={enabled} onEdit={onEdit} onDelete={onDelete} />)}</div>}</DropDay></CardContent></Card>)}</div></DndContext>;
}
