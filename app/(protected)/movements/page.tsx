"use client";
import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { isAfter } from "date-fns";

export default function MovementsPage() {
  const { movements, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OUT" | "PARTIAL_RETURN" | "RETURNED"
  >("ALL");

  const filteredMovements = useMemo(() => {
    return movements
      .filter((movement) => {
        const matchesSearch =
          movement.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          movement.useLocation
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          movement.responsiblePerson
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "ALL" || movement.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [movements, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = movements.length;
    const out = movements.filter((m) => m.status === "OUT").length;
    const partialReturns = movements.filter(
      (m) => m.status === "PARTIAL_RETURN"
    ).length;
    const returned = movements.filter((m) => m.status === "RETURNED").length;
    const overdue = movements.filter(
      (m) =>
        m.status === "OUT" && isAfter(new Date(), new Date(m.expectedReturnAt))
    ).length;

    return { total, out, partialReturns, returned, overdue };
  }, [movements]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OUT":
        return <ClockIcon className="h-4 w-4" />;
      case "PARTIAL_RETURN":
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case "RETURNED":
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string, expectedReturn: string) => {
    if (status === "RETURNED") return "default";
    if (status === "PARTIAL_RETURN") return "secondary";
    if (status === "OUT" && isAfter(new Date(), new Date(expectedReturn)))
      return "destructive";
    return "outline";
  };

  const canCreateDispatch = can.createDispatch(
    currentUser?.role || "STORE_KEEPER"
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Movements
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track dispatches, rentals, and returns across your stores
          </p>
        </div>
        {canCreateDispatch && (
          <Button asChild>
            <Link href="/movements/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Dispatch
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
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
              <CardTitle className="text-sm font-medium">Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.out}
              </div>
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
              <CardTitle className="text-sm font-medium">
                Partial Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.partialReturns}
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
              <CardTitle className="text-sm font-medium">Returned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.returned}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={stats.overdue > 0 ? "border-destructive" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.overdue > 0 ? "text-destructive" : ""
                }`}
              >
                {stats.overdue}
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
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, location, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select
                value={statusFilter}
                onValueChange={(value: typeof statusFilter) =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="OUT">Out</SelectItem>
                  <SelectItem value="PARTIAL_RETURN">Partial Return</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
          <CardDescription>
            {filteredMovements.length} of {movements.length} movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">ID</TableHead>
                  <TableHead className="min-w-[120px]">Customer</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Items</TableHead>
                  <TableHead className="hidden lg:table-cell">Store</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Expected Return
                  </TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => {
                  const isOverdue =
                    movement.status === "OUT" &&
                    isAfter(new Date(), new Date(movement.expectedReturnAt));

                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="font-mono text-sm">
                        <div>
                          <div>{movement.id}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {movement.lines.length} items • {movement.store}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {movement.customerName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {movement.responsiblePerson}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {movement.useLocation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {movement.useLocation}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          {movement.lines.length} items
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{movement.store}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div
                          className={
                            isOverdue ? "text-destructive font-medium" : ""
                          }
                        >
                          {new Date(
                            movement.expectedReturnAt
                          ).toLocaleDateString()}
                        </div>
                        {isOverdue && (
                          <div className="text-xs text-destructive">
                            Overdue
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(
                            movement.status,
                            movement.expectedReturnAt
                          )}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(movement.status)}
                          {movement.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/movements/${movement.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredMovements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No movements found</p>
              <p className="text-sm">
                {movements.length === 0
                  ? "Create your first dispatch to get started"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
