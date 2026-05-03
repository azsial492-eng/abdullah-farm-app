import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function FlockManagement() {
  const { batches, addBatch, updateMortality, deleteBatch } = useFarmData();
  const [mortalityInputs, setMortalityInputs] = useState<Record<string, string>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
    const qty = parseInt(formData.get("quantity") as string);
    addBatch({
      name: formData.get("name") as string,
      dateAdded: formData.get("date") as string,
      initialBirds: qty,
      activeBirds: qty,
      breed: formData.get("breed") as string,
      ageWeeks: parseInt(formData.get("age") as string),
    });
    setIsAddOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteBatch(deleteTarget.id);
      setDeleteTarget(null);
    }
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
              <DialogDescription>Enter the batch details below to register a new flock.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Name</Label>
                  <Input name="name" required placeholder="e.g. Batch D" data-testid="input-batch-name" />
                </div>
                <div className="space-y-2">
                  <Label>Date Added</Label>
                  <Input type="date" name="date" required data-testid="input-batch-date" />
                </div>
                <div className="space-y-2">
                  <Label>Quantity (Birds)</Label>
                  <Input type="number" name="quantity" required placeholder="5000" data-testid="input-batch-quantity" />
                </div>
                <div className="space-y-2">
                  <Label>Age (Weeks)</Label>
                  <Input type="number" name="age" required placeholder="16" data-testid="input-batch-age" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Breed</Label>
                  <Input name="breed" required placeholder="Lohmann Brown" data-testid="input-batch-breed" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" data-testid="btn-save-batch">Save Batch</Button>
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
                <TableHead className="text-right w-[220px]">Record Mortality</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id} className="group">
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.dateAdded}</TableCell>
                  <TableCell>{batch.breed}</TableCell>
                  <TableCell>{batch.ageWeeks} weeks</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {batch.initialBirds.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {batch.activeBirds.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                      <Input
                        type="number"
                        placeholder="Dead"
                        className="w-20 h-8 text-right"
                        value={mortalityInputs[batch.id] || ""}
                        onChange={(e) =>
                          setMortalityInputs(prev => ({ ...prev, [batch.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleMortalitySubmit(batch.id)}
                        data-testid={`input-mortality-${batch.id}`}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        onClick={() => handleMortalitySubmit(batch.id)}
                        data-testid={`btn-save-mortality-${batch.id}`}
                      >
                        Save
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteTarget({ id: batch.id, name: batch.name })}
                      data-testid={`btn-delete-batch-${batch.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No active batches. Add a batch to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} data-testid="btn-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              data-testid="btn-confirm-delete"
            >
              Delete Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
