"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-store";
import { can } from "@/lib/roles";
import { Item, StoreId } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { getStoreDisplayName } from "@/lib/roles";
import { formatISO } from "date-fns";

export default function InventoryPage() {
  const { items, addItem, updateItem, deleteItem, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<"ALL" | StoreId>("ALL");
  const [selectedType, setSelectedType] = useState<"ALL" | string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    type: "",
    quantity: 1,
    store: "BOBA" as StoreId,
    dateOfEntry: new Date().toISOString().split("T")[0],
  });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.type?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesStore =
        selectedStore === "ALL" || item.store === selectedStore;
      const matchesType = selectedType === "ALL" || item.type === selectedType;

      return matchesSearch && matchesStore && matchesType;
    });
  }, [items, searchTerm, selectedStore, selectedType]);

  const itemTypes = useMemo(() => {
    const types = new Set(
      items
        .map((item) => item.type)
        .filter((type): type is string => Boolean(type))
    );
    return Array.from(types);
  }, [items]);

  const stats = useMemo(() => {
    const total = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const inStock = filteredItems.reduce((sum, item) => sum + item.inStock, 0);
    const out = total - inStock;

    return { total, inStock, out, items: filteredItems.length };
  }, [filteredItems]);

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      type: "",
      quantity: 1,
      store: "BOBA",
      dateOfEntry: new Date().toISOString().split("T")[0],
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        brand: item.brand || "",
        type: item.type || "",
        quantity: item.quantity,
        store: item.store,
        dateOfEntry: item.dateOfEntry.split("T")[0],
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const itemData = {
      ...formData,
      dateOfEntry: formatISO(new Date(formData.dateOfEntry)),
      brand: formData.brand || undefined,
      type: formData.type || undefined,
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (item: Item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  const canAddItem = can.addItem(currentUser?.role || "STORE_KEEPER");
  const canDeleteItem = can.deleteItem(currentUser?.role || "STORE_KEEPER");

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Inventory
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your items and track stock levels across stores
          </p>
        </div>
        {canAddItem && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Item" : "Add New Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the item details below."
                    : "Add a new item to your inventory."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Plastic Chairs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brand: e.target.value,
                        }))
                      }
                      placeholder="e.g., Generic"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      placeholder="e.g., Seating, Audio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store">Store *</Label>
                    <Select
                      value={formData.store}
                      onValueChange={(value: StoreId) =>
                        setFormData((prev) => ({ ...prev, store: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOBA">Boba</SelectItem>
                        <SelectItem value="MIKOCHENI">Mikocheni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateOfEntry">Date of Entry *</Label>
                    <Input
                      id="dateOfEntry"
                      type="date"
                      value={formData.dateOfEntry}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dateOfEntry: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingItem ? "Update" : "Add"} Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.items}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.inStock}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Out on Rental
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.out}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:flex-wrap md:gap-4 md:space-y-0">
            <div className="flex-1 md:min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="store-filter">Store</Label>
              <Select
                value={selectedStore}
                onValueChange={(value: "ALL" | StoreId) =>
                  setSelectedStore(value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Stores</SelectItem>
                  <SelectItem value="BOBA">Boba</SelectItem>
                  <SelectItem value="MIKOCHENI">Mikocheni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {itemTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {filteredItems.length} of {items.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Brand</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Store</TableHead>
                  <TableHead className="text-right min-w-[70px]">Qty</TableHead>
                  <TableHead className="text-right min-w-[70px]">
                    Stock
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    Out
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Date Added
                  </TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{item.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {item.brand && `${item.brand} • `}
                          {item.type && (
                            <Badge variant="secondary" className="text-xs">
                              {item.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {item.brand || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.type && (
                        <Badge variant="secondary">{item.type}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {getStoreDisplayName(item.store)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.inStock > 0
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {item.inStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <span
                        className={
                          item.quantity - item.inStock > 0
                            ? "text-orange-600"
                            : "text-muted-foreground"
                        }
                      >
                        {item.quantity - item.inStock}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.dateOfEntry).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(item)}
                          className="h-8 w-8 p-0"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {canDeleteItem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FunnelIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
