import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState } from "react";
import { PackagePlus, PackageMinus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function Inventory() {
  const { feedStock, addFeed, consumeFeed, inventory, addInventoryItem } = useFarmData();
  
  const [feedAdd, setFeedAdd] = useState("");
  const [feedConsume, setFeedConsume] = useState("");
  const [isItemOpen, setIsItemOpen] = useState(false);

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(feedAdd);
    if (val > 0) {
      addFeed(val);
      setFeedAdd("");
    }
  };

  const handleConsumeFeed = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(feedConsume);
    if (val > 0 && val <= feedStock) {
      consumeFeed(val);
      setFeedConsume("");
    }
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addInventoryItem({
      id: Math.random().toString(),
      name: formData.get("name") as string,
      quantity: parseInt(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      expiryDate: formData.get("expiry") as string,
      notes: formData.get("notes") as string,
    });
    setIsItemOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory & Feed</h2>
        <p className="text-muted-foreground mt-1">Manage feed stock, medicines, and supplies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feed Management */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm bg-primary text-primary-foreground border-none">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-primary-foreground/80 font-medium mb-1">Current Feed Stock</p>
                <div className="text-6xl font-bold">{feedStock}</div>
                <p className="text-primary-foreground/80 mt-1">50kg Bags</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Update Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddFeed} className="flex gap-2">
                <Input type="number" placeholder="Bags received" value={feedAdd} onChange={(e) => setFeedAdd(e.target.value)} min="1" required />
                <Button type="submit" variant="secondary" className="shrink-0"><PackagePlus className="w-4 h-4 mr-2" /> Add</Button>
              </form>
              <form onSubmit={handleConsumeFeed} className="flex gap-2">
                <Input type="number" placeholder="Bags consumed" value={feedConsume} onChange={(e) => setFeedConsume(e.target.value)} min="1" max={feedStock} required />
                <Button type="submit" variant="outline" className="shrink-0"><PackageMinus className="w-4 h-4 mr-2" /> Use</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* General Inventory */}
        <div className="md:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Medicines & Supplies</CardTitle>
                <CardDescription>Track vaccines, vitamins, and equipment.</CardDescription>
              </div>
              <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Item</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddItem} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input name="name" required placeholder="e.g. Vitamin C" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" name="quantity" required placeholder="10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input name="unit" required placeholder="Bottles, Pkts, etc." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input type="date" name="expiry" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input name="notes" placeholder="Optional details" />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Item</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                      <TableCell>{item.expiryDate || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={item.notes}>{item.notes}</TableCell>
                    </TableRow>
                  ))}
                  {inventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No items in inventory.</TableCell>
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
