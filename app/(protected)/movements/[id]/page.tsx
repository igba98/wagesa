"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-store";
import { can } from "@/lib/roles";
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
import { Separator } from "@/components/ui/separator";
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
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { isAfter } from "date-fns";
import { toast } from "sonner";

export default function MovementDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { movements, items, users, currentUser, registerReturn } = useApp();
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnData, setReturnData] = useState({
    receivedByUserId: currentUser?.id || "",
    lines: [] as { itemId: string; quantity: number }[],
  });

  const movement = movements.find((m) => m.id === params.id);

  const movementItems = useMemo(() => {
    if (!movement) return [];
    return movement.lines
      .map((line) => {
        const item = items.find((i) => i.id === line.itemId);
        return {
          ...line,
          item,
        };
      })
      .filter((item) => item.item);
  }, [movement, items]);

  const authorizedUser = users.find(
    (u) => u.id === movement?.authorizedByUserId
  );
  const issuedUser = users.find((u) => u.id === movement?.issuedByUserId);
  const isOverdue =
    movement &&
    movement.status === "OUT" &&
    isAfter(new Date(), new Date(movement.expectedReturnAt));

  const canRegisterReturn = can.confirmReturn(
    currentUser?.role || "STORE_KEEPER"
  );

  // Initialize return data when dialog opens
  const openReturnDialog = () => {
    if (!movement) return;

    setReturnData({
      receivedByUserId: currentUser?.id || "",
      lines: movement.lines.map((line) => ({
        itemId: line.itemId,
        quantity: line.quantity, // Default to full return
      })),
    });
    setIsReturnDialogOpen(true);
  };

  const updateReturnQuantity = (itemId: string, quantity: number) => {
    setReturnData((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.itemId === itemId
          ? { ...line, quantity: Math.max(0, quantity) }
          : line
      ),
    }));
  };

  const handleReturn = async () => {
    if (!movement || !currentUser) return;

    // Validate return quantities
    const hasValidReturns = returnData.lines.some((line) => line.quantity > 0);
    if (!hasValidReturns) {
      toast.error("Please specify quantities to return");
      return;
    }

    // Check for over-returns
    const hasOverReturns = returnData.lines.some((line) => {
      const originalLine = movement.lines.find((l) => l.itemId === line.itemId);
      return originalLine && line.quantity > originalLine.quantity;
    });

    if (hasOverReturns) {
      toast.error("Cannot return more items than were dispatched");
      return;
    }

    setIsSubmitting(true);

    try {
      const validLines = returnData.lines.filter((line) => line.quantity > 0);

      registerReturn(movement.id, {
        movementId: movement.id,
        receivedByUserId: returnData.receivedByUserId || currentUser.id,
        lines: validLines,
      });

      toast.success("Return registered successfully!");
      setIsReturnDialogOpen(false);

      // Refresh the page or redirect
      router.refresh();
    } catch (error) {
      toast.error("Failed to register return");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!movement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/movements">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Movements
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Movement not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (movement.status) {
      case "OUT":
        return <ClockIcon className="h-5 w-5" />;
      case "PARTIAL_RETURN":
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case "RETURNED":
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (movement.status === "RETURNED") return "default";
    if (movement.status === "PARTIAL_RETURN") return "secondary";
    if (isOverdue) return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/movements">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Movements
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Movement #{movement.id}
            </h1>
            <p className="text-muted-foreground">
              Created on {new Date(movement.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={getStatusColor()}
            className="flex items-center gap-2 px-3 py-1"
          >
            {getStatusIcon()}
            {movement.status.replace("_", " ")}
          </Badge>

          {canRegisterReturn && movement.status !== "RETURNED" && (
            <Dialog
              open={isReturnDialogOpen}
              onOpenChange={setIsReturnDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={openReturnDialog}>
                  <ArrowPathIcon className="mr-2 h-4 w-4" />
                  Register Return
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Register Return</DialogTitle>
                  <DialogDescription>
                    Specify the quantities being returned for this dispatch
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="receivedBy">Received By</Label>
                    <Select
                      value={returnData.receivedByUserId}
                      onValueChange={(value) =>
                        setReturnData((prev) => ({
                          ...prev,
                          receivedByUserId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                  <div>
                    <Label>Return Quantities</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">
                            Dispatched
                          </TableHead>
                          <TableHead className="text-right">
                            Returning
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movementItems.map(({ itemId, quantity, item }) => {
                          const returnLine = returnData.lines.find(
                            (l) => l.itemId === itemId
                          );
                          const returnQuantity = returnLine?.quantity || 0;

                          return (
                            <TableRow key={itemId}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {item?.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {item?.brand} • {item?.type}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  max={quantity}
                                  value={returnQuantity}
                                  onChange={(e) =>
                                    updateReturnQuantity(
                                      itemId,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 text-right"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsReturnDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleReturn} disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Register Return"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isOverdue && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-destructive">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-medium">This dispatch is overdue!</span>
                <span className="text-sm">
                  Expected return was{" "}
                  {new Date(movement.expectedReturnAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Movement Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Customer
                  </Label>
                  <p className="text-lg">{movement.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Responsible Person
                  </Label>
                  <p className="text-lg">{movement.responsiblePerson}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Use Location
                </Label>
                <p className="text-lg">{movement.useLocation}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Store
                  </Label>
                  <Badge variant="outline" className="mt-1">
                    {movement.store}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Expected Return
                  </Label>
                  <p
                    className={`text-lg ${
                      isOverdue ? "text-destructive font-medium" : ""
                    }`}
                  >
                    {new Date(movement.expectedReturnAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Authorized By
                  </Label>
                  <p>{authorizedUser?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Issued By
                  </Label>
                  <p>{issuedUser?.name || "Unknown"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dispatched Items</CardTitle>
              <CardDescription>
                {movementItems.length} items in this dispatch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementItems.map(({ itemId, quantity, item }) => (
                    <TableRow key={itemId}>
                      <TableCell className="font-medium">
                        {item?.name}
                      </TableCell>
                      <TableCell>{item?.brand || "-"}</TableCell>
                      <TableCell>
                        {item?.type && (
                          <Badge variant="secondary">{item.type}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Items:
                  </span>
                  <span className="font-medium">{movementItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Quantity:
                  </span>
                  <span className="font-medium">
                    {movementItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={getStatusColor()}>
                    {movement.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p>{new Date(movement.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Expected Return:
                  </span>
                  <p
                    className={isOverdue ? "text-destructive font-medium" : ""}
                  >
                    {new Date(movement.expectedReturnAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
