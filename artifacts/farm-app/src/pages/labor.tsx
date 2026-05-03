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
  CheckCircle2, XCircle, Clock, LogIn,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

const WAGE_MULTIPLIER: Record<"present" | "absent" | "half", number> = {
  present: 1,
  half: 0.5,
  absent: 0,
};

const STATUS_CONFIG = {
  present: {
    label: "Present",
    icon: CheckCircle2,
    classes: "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20",
    active: "bg-primary text-white border-primary shadow-md",
  },
  half: {
    label: "Half Day",
    icon: Clock,
    classes: "bg-accent/10 text-accent border-accent/25 hover:bg-accent/20",
    active: "bg-accent text-white border-accent shadow-md",
  },
  absent: {
    label: "Absent",
    icon: XCircle,
    classes: "bg-destructive/10 text-destructive border-destructive/25 hover:bg-destructive/20",
    active: "bg-destructive text-white border-destructive shadow-md",
  },
} as const;

function offsetDate(base: string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const BASE_DATE = "2023-10-07";

export default function Labor() {
  const { workers, addWorker, deleteWorker, attendance, setAttendance, addTransaction } = useFarmData();

  const [dateOffset, setDateOffset] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());

  const currentDate = offsetDate(BASE_DATE, dateOffset);

  const dayStats = useMemo(() => {
    let totalWage = 0;
    let present = 0;
    let half = 0;
    let absent = 0;

    workers.forEach((w) => {
      const key = `${w.id}::${currentDate}`;
      const status = attendance[key] ?? "absent";
      totalWage += w.dailyWage * WAGE_MULTIPLIER[status];
      if (status === "present") present++;
      else if (status === "half") half++;
      else absent++;
    });

    return { totalWage, present, half, absent };
  }, [workers, attendance, currentDate]);

  const handleAddWorker = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addWorker({
      id: Math.random().toString(36).slice(2),
      name: fd.get("name") as string,
      role: fd.get("role") as string,
      dailyWage: parseFloat(fd.get("wage") as string),
    });
    setIsAddOpen(false);
  };

  const handleLogLaborCost = () => {
    if (dayStats.totalWage > 0) {
      addTransaction({
        id: Math.random().toString(36).slice(2),
        type: "expense",
        category: "Labor",
        amount: dayStats.totalWage,
        date: currentDate,
        notes: `${dayStats.present}P / ${dayStats.half}H / ${dayStats.absent}A — ${workers.length} workers`,
      });
      setLoggedDates(prev => new Set(prev).add(currentDate));
    }
  };

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

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Labor & Attendance</h2>
          <p className="text-muted-foreground mt-1">Mark daily attendance and calculate labor costs automatically.</p>
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

      {/* Date navigator */}
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

      {/* Summary chips */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present", value: dayStats.present, color: "text-primary", bg: "bg-primary/10" },
          { label: "Half Day", value: dayStats.half, color: "text-accent", bg: "bg-accent/10" },
          { label: "Absent", value: dayStats.absent, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Total Workers", value: workers.length, color: "text-foreground", bg: "bg-muted/60" },
        ].map((chip) => (
          <Card key={chip.label} className="shadow-sm">
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${chip.bg} flex items-center justify-center shrink-0`}>
                <Users className={`w-5 h-5 ${chip.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{chip.label}</p>
                <p className={`text-2xl font-bold ${chip.color}`}>{chip.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Attendance register */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Daily Register
              </CardTitle>
              <CardDescription>Tap a status button to mark each worker. Changes are instant.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {loggedDates.has(currentDate) && (
                <Badge className="bg-primary/10 text-primary border-primary/20">Logged to Finance</Badge>
              )}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Labor Cost</p>
                <p className="text-xl font-bold text-foreground" data-testid="stat-labor-cost">
                  PKR {dayStats.totalWage.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={handleLogLaborCost}
                disabled={dayStats.totalWage === 0 || loggedDates.has(currentDate)}
                className="gap-2 shrink-0"
                data-testid="btn-log-labor"
              >
                <LogIn className="w-4 h-4" />
                Log as Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No workers added yet.</p>
                <p className="text-sm mt-1">Click "Add Worker" to build your roster.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {workers.map((worker) => {
                    const key = `${worker.id}::${currentDate}`;
                    const status = attendance[key] ?? "absent";
                    const earned = worker.dailyWage * WAGE_MULTIPLIER[status];

                    return (
                      <motion.div
                        key={worker.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                        data-testid={`row-worker-${worker.id}`}
                      >
                        {/* Worker info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                            {worker.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{worker.name}</p>
                            <p className="text-xs text-muted-foreground">{worker.role} · PKR {worker.dailyWage.toLocaleString()}/day</p>
                          </div>
                        </div>

                        {/* Status buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {(["present", "half", "absent"] as const).map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            const Icon = cfg.icon;
                            const isActive = status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => setAttendance(key, s)}
                                className={`
                                  flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold
                                  transition-all duration-150
                                  ${isActive ? cfg.active : cfg.classes}
                                `}
                                data-testid={`btn-status-${s}-${worker.id}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {cfg.label}
                              </button>
                            );
                          })}

                          {/* Earned amount */}
                          <div className="ml-2 text-right min-w-[80px]">
                            <p className="text-xs text-muted-foreground">Earned</p>
                            <p className={`font-bold text-sm ${earned > 0 ? "text-primary" : "text-muted-foreground line-through"}`}>
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

            {/* Totals footer */}
            {workers.length > 0 && (
              <div className="mt-4 pt-4 border-t flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span><span className="font-semibold text-primary">{dayStats.present}</span> present</span>
                  <span><span className="font-semibold text-accent">{dayStats.half}</span> half-day</span>
                  <span><span className="font-semibold text-destructive">{dayStats.absent}</span> absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total payable:</span>
                  <span className="text-lg font-bold text-foreground">PKR {dayStats.totalWage.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Worker roster management */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Worker Roster</CardTitle>
            <CardDescription>All registered workers and their base daily wages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {workers.map((worker, i) => (
                <div key={worker.id} className="group flex items-center justify-between py-3 gap-4" data-testid={`roster-row-${worker.id}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                    <div>
                      <p className="font-medium text-foreground">{worker.name}</p>
                      <p className="text-xs text-muted-foreground">{worker.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Daily Wage</p>
                      <p className="font-semibold text-foreground">PKR {worker.dailyWage.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ id: worker.id, name: worker.name })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      data-testid={`btn-roster-delete-${worker.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {workers.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No workers on roster.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Worker</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> from the roster? Their attendance history will be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteWorker(deleteTarget!.id); setDeleteTarget(null); }} data-testid="btn-confirm-delete-worker">
              Remove Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
