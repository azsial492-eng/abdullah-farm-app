import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";

export default function Health() {
  const { healthEvents, batches } = useFarmData();

  const sortedEvents = [...healthEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
      case "Upcoming": return "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20";
      case "Overdue": return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Health & Vaccination</h2>
          <p className="text-muted-foreground mt-1">Schedule and track flock health events.</p>
        </div>
      </div>

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
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Vaccine / Treatment</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => {
                const batch = batches.find(b => b.id === event.batchId);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium whitespace-nowrap">{event.date}</TableCell>
                    <TableCell>{batch?.name || "Unknown Batch"}</TableCell>
                    <TableCell>{event.vaccineName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No health events scheduled.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
