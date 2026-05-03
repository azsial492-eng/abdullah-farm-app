import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function FlockManagement() {
  const { batches, addBatch, updateMortality } = useFarmData();
  const [mortalityInputs, setMortalityInputs] = useState<Record<string, string>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleMortalitySubmit = (batchId: string) => {
    const val = parseInt(mortalityInputs[batchId]);
    if (!isNaN(val) && val > 0) {
      updateMortality(batchId, val);
      setMortalityInputs(prev => ({ ...prev, [batchId]: "" }));
    }
  };

  const handleAddBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBatch = {
      id: Math.random().toString(),
      name: formData.get("name") as string,
      dateAdded: formData.get("date") as string,
      initialBirds: parseInt(formData.get("quantity") as string),
      activeBirds: parseInt(formData.get("quantity") as string),
      breed: formData.get("breed") as string,
      ageWeeks: parseInt(formData.get("age") as string),
    };
    addBatch(newBatch);
    setIsAddOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Flock Management</h2>
          <p className="text-muted-foreground mt-1">Track batches, mortality, and active bird counts.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-batch">
              <Plus className="w-4 h-4" /> Add New Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Batch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Name</Label>
                  <Input name="name" required placeholder="e.g. Batch D" />
                </div>
                <div className="space-y-2">
                  <Label>Date Added</Label>
                  <Input type="date" name="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Quantity (Birds)</Label>
                  <Input type="number" name="quantity" required placeholder="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Age (Weeks)</Label>
                  <Input type="number" name="age" required placeholder="16" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Breed</Label>
                  <Input name="breed" required placeholder="Lohmann Brown" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Batch</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Active Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Batch Name</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="text-right">Initial Birds</TableHead>
                <TableHead className="text-right">Active Birds</TableHead>
                <TableHead className="text-right w-[200px]">Record Mortality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id} className="group">
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.dateAdded}</TableCell>
                  <TableCell>{batch.breed}</TableCell>
                  <TableCell>{batch.ageWeeks} weeks</TableCell>
                  <TableCell className="text-right text-muted-foreground">{batch.initialBirds.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{batch.activeBirds.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                      <Input 
                        type="number" 
                        placeholder="Dead" 
                        className="w-20 h-8 text-right"
                        value={mortalityInputs[batch.id] || ""}
                        onChange={(e) => setMortalityInputs(prev => ({ ...prev, [batch.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleMortalitySubmit(batch.id)}
                      />
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => handleMortalitySubmit(batch.id)}>Save</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No active batches found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
