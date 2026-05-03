import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState } from "react";
import { CalendarDays, Plus, Trash2, Syringe } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-primary/10 text-primary border-primary/20",
  Upcoming:  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Overdue:   "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Health() {
  const { healthEvents, addHealthEvent, deleteHealthEvent, batches } = useFarmData();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [status, setStatus] = useState<"Upcoming" | "Completed" | "Overdue">("Upcoming");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const sortedEvents = [...healthEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addHealthEvent({
      id: Math.random().toString(36).slice(2),
      batchId,
      vaccineName: fd.get("vaccine") as string,
      date: fd.get("date") as string,
      status,
    });
    setBatchId("");
    setStatus("Upcoming");
    setIsAddOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Health & Vaccination</h2>
          <p className="text-muted-foreground mt-1">Schedule and track flock vaccination events.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-vaccine">
              <Plus className="w-4 h-4" /> Schedule Vaccine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Syringe className="w-5 h-5 text-primary" />
                Schedule Vaccination
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select required value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger data-testid="select-batch">
                    <SelectValue placeholder="Select a batch…" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} — {b.breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vaccine / Treatment Name</Label>
                <Input
                  name="vaccine"
                  required
                  placeholder="e.g. Newcastle Disease"
                  data-testid="input-vaccine-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" name="date" required data-testid="input-vaccine-date" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as typeof status)}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={!batchId} className="w-full" data-testid="btn-save-vaccine">
                  Save Schedule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Completed", style: STATUS_STYLES.Completed },
          { label: "Upcoming",  style: STATUS_STYLES.Upcoming  },
          { label: "Overdue",   style: STATUS_STYLES.Overdue   },
        ].map(({ label, style }) => (
          <Badge key={label} variant="outline" className={`${style} text-xs px-3 py-1`}>
            {label}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-1">
          {sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} scheduled
        </span>
      </div>

      {/* Schedule table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Vaccination Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Vaccine / Treatment</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => {
                const batch = batches.find((b) => b.id === event.batchId);
                return (
                  <TableRow key={event.id} className="group" data-testid={`row-health-${event.id}`}>
                    <TableCell className="font-medium whitespace-nowrap">{event.date}</TableCell>
                    <TableCell>{batch?.name ?? "Unknown Batch"}</TableCell>
                    <TableCell className="font-medium">{event.vaccineName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={STATUS_STYLES[event.status] ?? ""}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setDeleteTarget({ id: event.id, name: event.vaccineName })
                        }
                        data-testid={`btn-delete-vaccine-${event.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Syringe className="w-8 h-8 mx-auto mb-2 opacity-25" />
                    <p className="font-medium">No vaccinations scheduled.</p>
                    <p className="text-sm mt-1">Click "Schedule Vaccine" to add one.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vaccination Event</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> from the schedule? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteHealthEvent(deleteTarget!.id);
                setDeleteTarget(null);
              }}
              data-testid="btn-confirm-delete-vaccine"
            >
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
