"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-store";
import { StoreId, DispatchLine } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { addDays, formatISO } from "date-fns";
import { toast } from "sonner";

export default function NewDispatchPage() {
  const router = useRouter();
  const { items, users, currentUser, createDispatch } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    store: "BOBA" as StoreId,
    customerName: "",
    responsiblePerson: "",
    useLocation: "",
    expectedReturnAt: formatISO(addDays(new Date(), 3)).slice(0, 16),
    authorizedByUserId: currentUser?.id || "",
  });

  const [lines, setLines] = useState<DispatchLine[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  // Filter items by selected store and available stock
  const availableItems = useMemo(() => {
    return items.filter(
      (item) => item.store === formData.store && item.inStock > 0
    );
  }, [items, formData.store]);

  // Calculate totals
  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const item = items.find((i) => i.id === line.itemId);
        return {
          items: acc.items + 1,
          quantity: acc.quantity + line.quantity,
          value: acc.value + line.quantity * 1, // Mock value calculation
        };
      },
      { items: 0, quantity: 0, value: 0 }
    );
  }, [lines, items]);

  const addItem = () => {
    if (!selectedItemId) return;

    const existingLine = lines.find((line) => line.itemId === selectedItemId);
    if (existingLine) {
      toast.error("Item already added to dispatch");
      return;
    }

    setLines((prev) => [...prev, { itemId: selectedItemId, quantity: 1 }]);
    setSelectedItemId("");
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const maxQuantity = item.inStock;
    const validQuantity = Math.max(1, Math.min(quantity, maxQuantity));

    setLines((prev) =>
      prev.map((line) =>
        line.itemId === itemId ? { ...line, quantity: validQuantity } : line
      )
    );
  };

  const removeLine = (itemId: string) => {
    setLines((prev) => prev.filter((line) => line.itemId !== itemId));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!formData.useLocation.trim()) {
      toast.error("Use location is required");
      return;
    }

    if (!formData.responsiblePerson.trim()) {
      toast.error("Responsible person is required");
      return;
    }

    if (lines.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      const dispatch = {
        store: formData.store,
        lines,
        authorizedByUserId: formData.authorizedByUserId || currentUser.id,
        issuedByUserId: currentUser.id,
        customerName: formData.customerName.trim(),
        responsiblePerson: formData.responsiblePerson.trim(),
        useLocation: formData.useLocation.trim(),
        expectedReturnAt: formatISO(new Date(formData.expectedReturnAt)),
      };

      const result = createDispatch(dispatch);

      toast.success("Dispatch created successfully!");
      router.push(`/movements/${result.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create dispatch"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/movements">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Movements
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Dispatch</h1>
          <p className="text-muted-foreground">
            Create a new dispatch for rental items
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Information</CardTitle>
              <CardDescription>
                Basic details about the dispatch and customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store">Store *</Label>
                  <Select
                    value={formData.store}
                    onValueChange={(value: StoreId) => {
                      setFormData((prev) => ({ ...prev, store: value }));
                      setLines([]); // Clear lines when store changes
                    }}
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
                  <Label htmlFor="authorizedBy">Authorized By</Label>
                  <Select
                    value={formData.authorizedByUserId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        authorizedByUserId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u) => u.isActive)
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role.replace("_", " ")})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer Name *</Label>
                  <Input
                    id="customer"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="e.g., Alpha Events Ltd"
                  />
                </div>
                <div>
                  <Label htmlFor="responsible">Responsible Person *</Label>
                  <Input
                    id="responsible"
                    value={formData.responsiblePerson}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        responsiblePerson: e.target.value,
                      }))
                    }
                    placeholder="On-site contact person"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Use Location *</Label>
                <Input
                  id="location"
                  value={formData.useLocation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      useLocation: e.target.value,
                    }))
                  }
                  placeholder="Event venue or address"
                />
              </div>

              <div>
                <Label htmlFor="expectedReturn">
                  Expected Return Date & Time *
                </Label>
                <Input
                  id="expectedReturn"
                  type="datetime-local"
                  value={formData.expectedReturnAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expectedReturnAt: e.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Items</CardTitle>
              <CardDescription>
                Choose items from {formData.store} store for this dispatch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select
                  value={selectedItemId}
                  onValueChange={setSelectedItemId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select an item to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems
                      .filter(
                        (item) => !lines.find((line) => line.itemId === item.id)
                      )
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.brand}) - {item.inStock} available
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={addItem} disabled={!selectedItemId}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>

              {lines.length > 0 && (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead className="w-32">Quantity</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => {
                        const item = items.find((i) => i.id === line.itemId);
                        if (!item) return null;

                        return (
                          <TableRow key={line.itemId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.brand} • {item.type}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.inStock}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                max={item.inStock}
                                value={line.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    line.itemId,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLine(line.itemId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Store:</span>
                  <Badge variant="outline">{formData.store}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Customer:</span>
                  <span className="text-right">
                    {formData.customerName || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Location:</span>
                  <span className="text-right">
                    {formData.useLocation || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expected Return:</span>
                  <span className="text-right">
                    {new Date(formData.expectedReturnAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{totals.items}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Quantity:</span>
                  <span>{totals.quantity}</span>
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || lines.length === 0}
                className="w-full"
              >
                {isSubmitting ? (
                  "Creating Dispatch..."
                ) : (
                  <>
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    Create Dispatch
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {availableItems.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">
                    No items available at {formData.store} store
                  </p>
                  <p className="text-xs">Try selecting a different store</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
