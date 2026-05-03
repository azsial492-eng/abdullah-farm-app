import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Users, Plus, Trash2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, LogIn, Pencil, Check, X,
  CalendarRange, TrendingUp,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

// ── Constants ───────────────────────────────────────────────────
const WAGE_MULT: Record<"present" | "absent" | "half", number> = {
  present: 1, half: 0.5, absent: 0,
};

const STATUS_CFG = {
  present: {
    label: "Present", icon: CheckCircle2,
    idle: "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20",
    active: "bg-primary text-white border-primary shadow-md",
  },
  half: {
    label: "Half Day", icon: Clock,
    idle: "bg-accent/10 text-accent border-accent/25 hover:bg-accent/20",
    active: "bg-accent text-white border-accent shadow-md",
  },
  absent: {
    label: "Absent", icon: XCircle,
    idle: "bg-destructive/10 text-destructive border-destructive/25 hover:bg-destructive/20",
    active: "bg-destructive text-white border-destructive shadow-md",
  },
} as const;

// dummy "today" anchored to the app's data
const BASE_DATE = "2023-10-07";
const BASE_MONTH = "2023-10"; // starting salary month

function offsetDate(base: string, days: number) {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PK", {
    month: "long", year: "numeric",
  });
}

function daysInMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate(); // last day of month
}

function offsetMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Component ───────────────────────────────────────────────────
export default function Labor() {
  const {
    workers, addWorker, deleteWorker, updateWorkerWage,
    attendance, setAttendance, addTransaction,
  } = useFarmData();

  // Daily attendance date
  const [dateOffset, setDateOffset] = useState(0);
  const currentDate = offsetDate(BASE_DATE, dateOffset);

  // Salary month
  const [salaryMonth, setSalaryMonth] = useState(BASE_MONTH);
  const totalDays = daysInMonth(salaryMonth);

  // UI state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editingWage, setEditingWage] = useState<Record<string, string>>({}); // workerId → draft
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());

  // ── Daily stats ──────────────────────────────────────────────
  const dayStats = useMemo(() => {
    let total = 0, present = 0, half = 0, absent = 0;
    workers.forEach((w) => {
      const s = attendance[`${w.id}::${currentDate}`] ?? "absent";
      total += w.dailyWage * WAGE_MULT[s];
      if (s === "present") present++;
      else if (s === "half") half++;
      else absent++;
    });
    return { total, present, half, absent };
  }, [workers, attendance, currentDate]);

  // ── Monthly salary per worker ────────────────────────────────
  const monthlySalaries = useMemo(() => {
    return workers.map((w) => {
      let earnedSoFar = 0;
      let daysPresent = 0;
      let daysHalf = 0;

      // scan every attendance key for this worker in this month
      Object.entries(attendance).forEach(([key, status]) => {
        const [wid, date] = key.split("::");
        if (wid !== w.id) return;
        if (!date.startsWith(salaryMonth)) return;
        const earned = w.dailyWage * WAGE_MULT[status];
        earnedSoFar += earned;
        if (status === "present") daysPresent++;
        else if (status === "half") daysHalf++;
      });

      const projectedFull = w.dailyWage * totalDays;
      const pct = projectedFull > 0 ? Math.min(100, (earnedSoFar / projectedFull) * 100) : 0;
      return { worker: w, earnedSoFar, daysPresent, daysHalf, projectedFull, pct };
    });
  }, [workers, attendance, salaryMonth, totalDays]);

  const totalMonthlyEarned = monthlySalaries.reduce((s, r) => s + r.earnedSoFar, 0);

  // ── Handlers ─────────────────────────────────────────────────
  const handleAddWorker = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addWorker({
      id: Math.random().toString(36).slice(2),
      name: fd.get("name") as string,
      role: fd.get("role") as string,
      dailyWage: parseFloat(fd.get("wage") as string) || 0,
    });
    (e.target as HTMLFormElement).reset();
    setIsAddOpen(false);
  };

  const handleLogDailyLabor = () => {
    if (dayStats.total > 0) {
      addTransaction({
        id: Math.random().toString(36).slice(2),
        type: "expense",
        category: "Labor",
        amount: dayStats.total,
        date: currentDate,
        notes: `${dayStats.present}P / ${dayStats.half}H / ${dayStats.absent}A — ${workers.length} workers`,
      });
      setLoggedDates(prev => new Set(prev).add(currentDate));
    }
  };

  const handleLogMonthlySalary = () => {
    if (totalMonthlyEarned > 0) {
      addTransaction({
        id: Math.random().toString(36).slice(2),
        type: "expense",
        category: "Labor",
        amount: totalMonthlyEarned,
        date: `${salaryMonth}-${String(totalDays).padStart(2, "0")}`,
        notes: `Monthly salary — ${formatMonth(salaryMonth)} — ${workers.length} workers`,
      });
    }
  };

  const startWageEdit = (id: string, current: number) =>
    setEditingWage(prev => ({ ...prev, [id]: String(current) }));

  const confirmWageEdit = (id: string) => {
    const val = parseFloat(editingWage[id]);
    if (!isNaN(val) && val >= 0) updateWorkerWage(id, val);
    setEditingWage(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const cancelWageEdit = (id: string) =>
    setEditingWage(prev => { const n = { ...prev }; delete n[id]; return n; });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Labor & Attendance</h2>
          <p className="text-muted-foreground mt-1">Mark daily attendance, edit wages, and track monthly salaries.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-worker">
              <Plus className="w-4 h-4" /> Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
              <DialogDescription>Enter the worker's details to add them to the roster.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" required placeholder="e.g. Ahmed Raza" data-testid="input-worker-name" />
              </div>
              <div className="space-y-2">
                <Label>Role / Position</Label>
                <Input name="role" required placeholder="e.g. Egg Collector" data-testid="input-worker-role" />
              </div>
              <div className="space-y-2">
                <Label>Daily Wage (PKR)</Label>
                <Input type="number" name="wage" required placeholder="1200" min="0" step="50" data-testid="input-worker-wage" />
              </div>
              <DialogFooter>
                <Button type="submit" data-testid="btn-save-worker">Add Worker</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ── Date Navigator ── */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between gap-4">
              <Button variant="outline" size="icon" onClick={() => setDateOffset(d => d - 1)} data-testid="btn-prev-day">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Attendance Date</p>
                <p className="text-lg font-bold text-foreground">{formatDate(currentDate)}</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => setDateOffset(d => d + 1)} data-testid="btn-next-day">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Day summary chips ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present",       value: dayStats.present, color: "text-primary",     bg: "bg-primary/10"     },
          { label: "Half Day",      value: dayStats.half,    color: "text-accent",      bg: "bg-accent/10"      },
          { label: "Absent",        value: dayStats.absent,  color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Total Workers", value: workers.length,   color: "text-foreground",  bg: "bg-muted/60"       },
        ].map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                <Users className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Daily Register ── */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Daily Register
              </CardTitle>
              <CardDescription>Tap a status to mark attendance. Click the wage to edit it inline.</CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {loggedDates.has(currentDate) && (
                <Badge className="bg-primary/10 text-primary border-primary/20">Logged</Badge>
              )}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Day Labor Cost</p>
                <p className="text-xl font-bold" data-testid="stat-labor-cost">
                  PKR {dayStats.total.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={handleLogDailyLabor}
                disabled={dayStats.total === 0 || loggedDates.has(currentDate)}
                className="gap-2 shrink-0"
                data-testid="btn-log-labor"
              >
                <LogIn className="w-4 h-4" /> Log as Expense
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {workers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-25" />
                <p className="font-medium">No workers yet. Click "Add Worker" to start.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {workers.map((worker) => {
                    const attKey = `${worker.id}::${currentDate}`;
                    const status = attendance[attKey] ?? "absent";
                    const earned = worker.dailyWage * WAGE_MULT[status];
                    const isEditingW = editingWage[worker.id] !== undefined;

                    return (
                      <motion.div
                        key={worker.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                        data-testid={`row-worker-${worker.id}`}
                      >
                        {/* Avatar + info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                            {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{worker.name}</p>
                            <p className="text-xs text-muted-foreground">{worker.role}</p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-wrap">

                          {/* Inline wage editor */}
                          <div className="flex items-center gap-1">
                            {isEditingW ? (
                              <>
                                <span className="text-xs text-muted-foreground">PKR</span>
                                <Input
                                  type="number"
                                  className="w-24 h-7 text-xs text-right"
                                  value={editingWage[worker.id]}
                                  min={0}
                                  onChange={e => setEditingWage(p => ({ ...p, [worker.id]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") confirmWageEdit(worker.id);
                                    if (e.key === "Escape") cancelWageEdit(worker.id);
                                  }}
                                  autoFocus
                                  data-testid={`input-wage-edit-${worker.id}`}
                                />
                                <button onClick={() => confirmWageEdit(worker.id)} className="p-1 rounded text-primary hover:bg-primary/10" data-testid={`btn-wage-confirm-${worker.id}`}>
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => cancelWageEdit(worker.id)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startWageEdit(worker.id, worker.dailyWage)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                data-testid={`btn-edit-wage-${worker.id}`}
                              >
                                <Pencil className="w-3 h-3" />
                                PKR {worker.dailyWage.toLocaleString()}/day
                              </button>
                            )}
                          </div>

                          {/* Status buttons */}
                          {(["present", "half", "absent"] as const).map((s) => {
                            const cfg = STATUS_CFG[s];
                            const Icon = cfg.icon;
                            const isActive = status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => setAttendance(attKey, s)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${isActive ? cfg.active : cfg.idle}`}
                                data-testid={`btn-status-${s}-${worker.id}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {cfg.label}
                              </button>
                            );
                          })}

                          {/* Today earned */}
                          <div className="text-right min-w-[76px]">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</p>
                            <p className={`font-bold text-sm ${earned > 0 ? "text-primary" : "text-muted-foreground/50 line-through"}`}>
                              PKR {earned.toLocaleString()}
                            </p>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ id: worker.id, name: worker.name })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            data-testid={`btn-delete-worker-${worker.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {workers.length > 0 && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span><span className="font-semibold text-primary">{dayStats.present}</span> present</span>
                  <span><span className="font-semibold text-accent">{dayStats.half}</span> half-day</span>
                  <span><span className="font-semibold text-destructive">{dayStats.absent}</span> absent</span>
                </div>
                <span className="text-lg font-bold">PKR {dayStats.total.toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Monthly Salary Calculator ── */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-t-4 border-t-accent">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <CalendarRange className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Monthly Salary Calculator</CardTitle>
                  <CardDescription>
                    Based on attendance × daily wage. {totalDays} days in {formatMonth(salaryMonth)}.
                  </CardDescription>
                </div>
              </div>

              {/* Month navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSalaryMonth(m => offsetMonth(m, -1))}
                  data-testid="btn-prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center min-w-[130px]">
                  <p className="font-bold text-sm">{formatMonth(salaryMonth)}</p>
                  <p className="text-xs text-muted-foreground">{totalDays} days</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSalaryMonth(m => offsetMonth(m, 1))}
                  data-testid="btn-next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Month total banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20 flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Payroll — {formatMonth(salaryMonth)}</p>
                <p className="text-3xl font-bold" data-testid="stat-monthly-total">
                  PKR {totalMonthlyEarned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Earned so far based on marked attendance
                </p>
              </div>
              <Button
                onClick={handleLogMonthlySalary}
                disabled={totalMonthlyEarned === 0}
                className="gap-2 bg-accent hover:bg-accent/90"
                data-testid="btn-log-monthly-salary"
              >
                <LogIn className="w-4 h-4" /> Log Monthly Salaries
              </Button>
            </div>

            {/* Per-worker salary breakdown */}
            {workers.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">No workers on roster.</p>
            ) : (
              <div className="space-y-3">
                {monthlySalaries.map(({ worker, earnedSoFar, daysPresent, daysHalf, projectedFull, pct }) => (
                  <div key={worker.id} className="p-4 rounded-xl border bg-muted/10 space-y-3" data-testid={`salary-row-${worker.id}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{worker.name}</p>
                          <p className="text-xs text-muted-foreground">{worker.role} · PKR {worker.dailyWage.toLocaleString()}/day</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Earned</p>
                          <p className="font-bold text-primary">PKR {earnedSoFar.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Full Month</p>
                          <p className="font-semibold text-foreground">PKR {projectedFull.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Attendance mini-stats */}
                    <div className="flex gap-3 text-xs flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {daysPresent} full days
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                        {daysHalf} half days
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        of {totalDays} days
                      </span>
                    </div>

                    {/* Progress bar: earned vs projected */}
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Salary progress</span>
                        <span className="font-semibold text-foreground">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Formula note */}
                    <p className="text-[10px] text-muted-foreground italic">
                      Formula: {daysPresent} × PKR {worker.dailyWage.toLocaleString()} + {daysHalf} × PKR {(worker.dailyWage * 0.5).toLocaleString()} = PKR {earnedSoFar.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Month info footer */}
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>
                Full-month salary = daily wage × {totalDays} days ({formatMonth(salaryMonth)}).
                Only days marked <strong>Present</strong> or <strong>Half Day</strong> count toward earned salary.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Delete confirmation ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Worker</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> from the roster? Their attendance records will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { deleteWorker(deleteTarget!.id); setDeleteTarget(null); }}
              data-testid="btn-confirm-delete-worker"
            >
              Remove Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
