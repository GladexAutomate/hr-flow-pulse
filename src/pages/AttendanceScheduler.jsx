import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDatesInRange, SHIFT_TYPES, getShift, dayOfWeek } from "@/utils/attendanceUtils";
import { Loader2, Send, AlertCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const WFH_OPTIONS = ["Onsite", "WFH"];
const SHIFTS_WITH_WFH = ["Opener", "Mid", "Closer", "Night", "Custom"];

function ShiftPalette({ onDragStart }) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <span className="w-full text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Drag a shift onto a cell</span>
      {SHIFT_TYPES.map(s => (
        <div
          key={s.key}
          draggable
          onDragStart={() => onDragStart(s.key)}
          style={{ background: s.color, color: s.text }}
          className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-grab active:cursor-grabbing select-none shadow-sm border border-white/30"
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}

function CellEditor({ cell, onClose, onSave }) {
  const [label, setLabel] = useState(cell.customLabel || "");
  const [time, setTime] = useState(cell.customTime || "");
  const [wfh, setWfh] = useState(cell.wfh || "Onsite");
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-800">Custom Shift</h3>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Half Day)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <input value={time} onChange={e => setTime(e.target.value)} placeholder="Time range (e.g. 12pm–4pm)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Work Location</p>
          <div className="flex gap-2">
            {WFH_OPTIONS.map(o => (
              <button key={o} onClick={() => setWfh(o)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${wfh === o ? "bg-teal-500 text-white border-teal-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ customLabel: label, customTime: time, wfh })}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl py-2.5 text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

function ShiftCell({ cell, onDrop, onWfhChange, onDelete, missing, onSpreadDragStart, onSpreadDragEnter, isSpreading, spreadAxis }) {
  const [dragOver, setDragOver] = useState(false);
  const [hovered, setHovered] = useState(false);
  const shift = cell?.shift ? getShift(cell.shift) : null;
  const showWfh = shift && SHIFTS_WITH_WFH.includes(shift.key);

  const spreadingClass = isSpreading
    ? spreadAxis === "vertical"
      ? "bg-purple-50 ring-2 ring-purple-400"
      : "bg-blue-50 ring-2 ring-blue-400"
    : "";

  return (
    <td
      onDragOver={e => { e.preventDefault(); setDragOver(true); onSpreadDragEnter(); }}
      onDragLeave={() => { setDragOver(false); }}
      onDrop={e => { e.preventDefault(); setDragOver(false); onDrop(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`border border-gray-200 p-1 min-w-[72px] align-top transition-all relative
        ${dragOver && !isSpreading ? "bg-yellow-50 ring-2 ring-yellow-400" : ""}
        ${missing && !isSpreading ? "ring-2 ring-red-400 bg-red-50" : ""}
        ${spreadingClass}
      `}
    >
      {shift ? (
        <div className="relative">
          <div style={{ background: shift.color, color: shift.text }} className="rounded-lg px-2 py-1 text-center text-xs font-bold shadow-sm relative">
            {hovered && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="absolute -top-1.5 -right-1.5 z-30 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow transition-all"
                title="Remove shift"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
            {cell.shift === "Custom" ? (cell.customLabel || "Custom") : shift.label}
            {cell.customTime && <div className="text-xs opacity-80">{cell.customTime}</div>}
            {showWfh && (
              <select
                value={cell.wfh || "Onsite"}
                onChange={e => onWfhChange(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ background: "rgba(255,255,255,0.2)", color: shift.text, border: "none" }}
                className="mt-1 w-full text-xs rounded font-semibold cursor-pointer"
              >
                {WFH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
          </div>
          {/* Spread handles — shown on hover */}
          {hovered && (
            <>
              {/* Left */}
              <div
                draggable
                onDragStart={e => { e.stopPropagation(); onSpreadDragStart("left"); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2.5 z-20 bg-white border border-blue-300 rounded-full p-0.5 shadow-md cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-all"
                title="Drag left to fill"
              >
                <ChevronLeft className="w-3 h-3 text-blue-500" />
              </div>
              {/* Right */}
              <div
                draggable
                onDragStart={e => { e.stopPropagation(); onSpreadDragStart("right"); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2.5 z-20 bg-white border border-blue-300 rounded-full p-0.5 shadow-md cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-all"
                title="Drag right to fill"
              >
                <ChevronRight className="w-3 h-3 text-blue-500" />
              </div>
              {/* Up */}
              <div
                draggable
                onDragStart={e => { e.stopPropagation(); onSpreadDragStart("up"); }}
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2.5 z-20 bg-white border border-purple-300 rounded-full p-0.5 shadow-md cursor-grab active:cursor-grabbing hover:bg-purple-50 transition-all"
                title="Drag up to fill"
              >
                <ChevronUp className="w-3 h-3 text-purple-500" />
              </div>
              {/* Down */}
              <div
                draggable
                onDragStart={e => { e.stopPropagation(); onSpreadDragStart("down"); }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2.5 z-20 bg-white border border-purple-300 rounded-full p-0.5 shadow-md cursor-grab active:cursor-grabbing hover:bg-purple-50 transition-all"
                title="Drag down to fill"
              >
                <ChevronDown className="w-3 h-3 text-purple-500" />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-8 flex items-center justify-center text-gray-300 text-xs">drop</div>
      )}
    </td>
  );
}

export default function AttendanceScheduler() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragShift, setDragShift] = useState(null);
  const [customEditing, setCustomEditing] = useState(null); // {empId, date}
  const [showMissing, setShowMissing] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Spread-drag state: dragging a filled cell's handle across dates or employees
  // axis: "horizontal" | "vertical"
  // horizontal: { empId, dateIdx, fromIdx, toIdx }
  // vertical:   { dateIdx, empIdx, fromEmpIdx, toEmpIdx }
  const spreadRef = useRef(null);
  const [spreadRange, setSpreadRange] = useState(null);

  useEffect(() => {
    base44.entities.AttendanceProposal.filter({ id }).then(([p]) => {
      if (p) {
        setProposal(p);
        setEmployees(p.employees || []);
        setSchedule(p.schedule || {});
        setRemarks(p.remarks || "");
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;
  if (!proposal) return <div className="text-center py-32 text-gray-400">Proposal not found.</div>;

  const dates = getDatesInRange(proposal.period_start, proposal.period_end);

  const setCell = (empId, date, value) => {
    setSchedule(s => ({
      ...s,
      [empId]: { ...(s[empId] || {}), [date]: { ...(s[empId]?.[date] || {}), ...value } }
    }));
  };

  const getMissingCells = () => {
    const missing = [];
    employees.forEach(emp => {
      dates.forEach(d => {
        if (!(schedule[emp.id]?.[d]?.shift)) missing.push(`${emp.id}__${d}`);
      });
    });
    return missing;
  };

  const handleRowDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(employees);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setEmployees(reordered);
  };

  const handleSubmit = async () => {
    const missing = getMissingCells();
    if (missing.length > 0) { setShowMissing(true); return; }
    setSubmitting(true);
    await base44.entities.AttendanceProposal.update(id, {
      schedule, remarks, status: "Pending HR Review",
    });
    setSubmitting(false);
    navigate("/attendance-requests");
  };

  const missingSet = showMissing ? new Set(getMissingCells()) : new Set();

  const handleSpreadDragStart = (empId, empIdx, dateIdx, direction) => {
    const axis = (direction === "left" || direction === "right") ? "horizontal" : "vertical";
    spreadRef.current = { empId, empIdx, dateIdx, direction, axis };
    if (axis === "horizontal") {
      setSpreadRange({ axis, empId, empIdx, dateIdx, fromIdx: dateIdx, toIdx: dateIdx });
    } else {
      setSpreadRange({ axis, empId, empIdx, dateIdx, fromEmpIdx: empIdx, toEmpIdx: empIdx });
    }
  };

  const handleSpreadDragEnter = (empId, empIdx, dateIdx) => {
    if (!spreadRef.current) return;
    const { axis, empIdx: originEmpIdx, dateIdx: originDateIdx } = spreadRef.current;
    if (axis === "horizontal") {
      if (spreadRef.current.empId !== empId) return;
      setSpreadRange(r => ({ ...r, fromIdx: Math.min(originDateIdx, dateIdx), toIdx: Math.max(originDateIdx, dateIdx) }));
    } else {
      if (spreadRef.current.dateIdx !== dateIdx) return;
      setSpreadRange(r => ({ ...r, fromEmpIdx: Math.min(originEmpIdx, empIdx), toEmpIdx: Math.max(originEmpIdx, empIdx) }));
    }
  };

  const handleSpreadDrop = (empId, empIdx, dateIdx) => {
    if (!spreadRef.current || !spreadRange) return;
    const { axis, empId: originEmpId, empIdx: originEmpIdx, dateIdx: originDateIdx } = spreadRef.current;
    if (axis === "horizontal") {
      const sourceCell = schedule[originEmpId]?.[dates[originDateIdx]];
      if (!sourceCell) return;
      const { fromIdx, toIdx } = spreadRange;
      for (let i = fromIdx; i <= toIdx; i++) {
        setCell(originEmpId, dates[i], { ...sourceCell });
      }
    } else {
      const sourceCell = schedule[originEmpId]?.[dates[originDateIdx]];
      if (!sourceCell) return;
      const { fromEmpIdx, toEmpIdx } = spreadRange;
      for (let i = fromEmpIdx; i <= toEmpIdx; i++) {
        setCell(employees[i].id, dates[originDateIdx], { ...sourceCell });
      }
    }
    spreadRef.current = null;
    setSpreadRange(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-gray-800 text-lg">{proposal.team_name} — {proposal.period_label}</h2>
            <p className="text-sm text-gray-500">{proposal.company_name} / {proposal.branch_name} / {proposal.department_name}</p>
            <p className="text-sm text-gray-500">Leader: <span className="font-medium">{proposal.leader_name}</span></p>
          </div>
          <div className="text-sm text-gray-500">{employees.length} employees · {dates.length} days</div>
        </div>
      </div>

      {/* Shift Palette */}
      <ShiftPalette onDragStart={setDragShift} />

      {/* Missing warning */}
      {showMissing && getMissingCells().length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {getMissingCells().length} cells are missing a shift. Please fill all cells before submitting.
        </div>
      )}

      {/* Grid */}
      <DragDropContext onDragEnd={(result) => {
        // If it's a row reorder (not a spread drag), handle it
        if (result.type === "ROW") { handleRowDragEnd(result); return; }
        spreadRef.current = null; setSpreadRange(null);
      }}>
        <div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto"
          onDragEnd={() => { spreadRef.current = null; setSpreadRange(null); }}
        >
          <table className="border-collapse text-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="sticky left-0 z-10 bg-blue-900 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide min-w-[160px]">Employee</th>
                {dates.map(d => (
                  <th key={d} className="px-2 py-3 text-center text-xs font-semibold whitespace-nowrap min-w-[72px]">
                    <div>{d.slice(5)}</div>
                    <div className="text-blue-200 font-normal">{dayOfWeek(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <Droppable droppableId="employees" type="ROW" direction="vertical">
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {employees.map((emp, empIdx) => (
                    <Draggable key={emp.id} draggableId={emp.id} index={empIdx}>
                      {(drag, snapshot) => (
                        <tr
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`${empIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${snapshot.isDragging ? "opacity-80 shadow-lg" : ""}`}
                        >
                          <td className="sticky left-0 z-10 bg-inherit px-2 py-2 font-semibold text-gray-800 text-sm whitespace-nowrap border-r border-gray-200">
                            <div className="flex items-center gap-1.5">
                              <span {...drag.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0" title="Drag to reorder">
                                <GripVertical className="w-4 h-4" />
                              </span>
                              <div>
                                {emp.name}
                                {emp.position && <div className="text-xs text-gray-400 font-normal">{emp.position}</div>}
                              </div>
                            </div>
                          </td>
                          {dates.map((d, dIdx) => {
                            const isHSpread = spreadRange?.axis === "horizontal" &&
                              spreadRange.empId === emp.id &&
                              dIdx >= spreadRange.fromIdx && dIdx <= spreadRange.toIdx;
                            const isVSpread = spreadRange?.axis === "vertical" &&
                              spreadRange.dateIdx === dIdx &&
                              empIdx >= spreadRange.fromEmpIdx && empIdx <= spreadRange.toEmpIdx;
                            return (
                              <ShiftCell
                                key={d}
                                cell={schedule[emp.id]?.[d] || null}
                                missing={missingSet.has(`${emp.id}__${d}`)}
                                isSpreading={isHSpread || isVSpread}
                                spreadAxis={isVSpread ? "vertical" : "horizontal"}
                                onDrop={() => {
                                  if (spreadRef.current) { handleSpreadDrop(emp.id, empIdx, dIdx); return; }
                                  if (!dragShift) return;
                                  if (dragShift === "Custom") {
                                    setCustomEditing({ empId: emp.id, date: d });
                                    setCell(emp.id, d, { shift: "Custom", customLabel: "", customTime: "", wfh: "Onsite" });
                                  } else {
                                    const needsWfh = SHIFTS_WITH_WFH.includes(dragShift);
                                    setCell(emp.id, d, { shift: dragShift, wfh: needsWfh ? "Onsite" : undefined });
                                  }
                                }}
                                onWfhChange={val => setCell(emp.id, d, { wfh: val })}
                                onDelete={() => setSchedule(s => {
                                  const next = { ...s, [emp.id]: { ...(s[emp.id] || {}) } };
                                  delete next[emp.id][d];
                                  return next;
                                })}
                                onSpreadDragStart={dir => handleSpreadDragStart(emp.id, empIdx, dIdx, dir)}
                                onSpreadDragEnter={() => handleSpreadDragEnter(emp.id, empIdx, dIdx)}
                              />
                            );
                          })}
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </div>
      </DragDropContext>

      {/* Remarks */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <label className="block text-sm font-bold text-gray-700">Remarks</label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
          placeholder="Any notes or special instructions for this attendance period..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg text-base"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        Submit Attendance Request
      </button>

      {/* Custom editor modal */}
      {customEditing && (
        <CellEditor
          cell={schedule[customEditing.empId]?.[customEditing.date] || {}}
          onClose={() => setCustomEditing(null)}
          onSave={(data) => {
            setCell(customEditing.empId, customEditing.date, data);
            setCustomEditing(null);
          }}
        />
      )}
    </div>
  );
}