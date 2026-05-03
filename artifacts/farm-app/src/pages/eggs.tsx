import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Egg, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function EggProduction() {
  const { eggRecords, addEggRecord } = useFarmData();
  
  const [goodEggs, setGoodEggs] = useState("");
  const [damagedEggs, setDamagedEggs] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const numGood = parseInt(goodEggs) || 0;
  const numDamaged = parseInt(damagedEggs) || 0;
  const total = numGood + numDamaged;
  const trays = Math.floor(numGood / 30);
  const looseEggs = numGood % 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total > 0) {
      addEggRecord({
        id: Math.random().toString(),
        date,
        totalCollected: total,
        goodEggs: numGood,
        damagedEggs: numDamaged,
        traysPacked: trays
      });
      setGoodEggs("");
      setDamagedEggs("");
      toast.success("Production record saved successfully.");
    }
  };

  const recentRecords = useMemo(() => {
    return [...eggRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [eggRecords]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Egg Production</h2>
        <p className="text-muted-foreground mt-1">Record daily collections and track packing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="shadow-sm border-t-4 border-t-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Egg className="w-5 h-5 text-accent" />
                Daily Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Good Eggs</Label>
                  <Input type="number" min="0" value={goodEggs} onChange={(e) => setGoodEggs(e.target.value)} required placeholder="e.g. 10500" className="text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Damaged / Broken</Label>
                  <Input type="number" min="0" value={damagedEggs} onChange={(e) => setDamagedEggs(e.target.value)} required placeholder="e.g. 150" />
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg border space-y-3 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Collected</span>
                    <span className="font-bold">{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-primary">
                    <span className="font-medium text-sm">Trays Packed (30/tray)</span>
                    <div className="text-right">
                      <span className="font-bold text-xl">{trays}</span>
                      {looseEggs > 0 && <span className="text-xs text-muted-foreground ml-1">+ {looseEggs} loose</span>}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={total === 0}>
                  <CheckCircle2 className="w-4 h-4" /> Save Record
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle>Recent History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right text-primary">Good</TableHead>
                    <TableHead className="text-right text-destructive">Damaged</TableHead>
                    <TableHead className="text-right">Trays Packed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell className="text-right">{record.totalCollected.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-primary font-medium">{record.goodEggs.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-destructive">{record.damagedEggs.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{record.traysPacked}</TableCell>
                    </TableRow>
                  ))}
                  {recentRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
