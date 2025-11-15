"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import {
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  isWithinInterval,
  format,
  subWeeks,
  subMonths,
} from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type ReportPeriod = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

const COLORS = ["#000000", "#404040", "#808080", "#C0C0C0"];

export default function ReportsPage() {
  const { items, movements } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("MONTH");

  const periodData = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (selectedPeriod) {
      case "WEEK":
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case "MONTH":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "QUARTER":
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        break;
      case "YEAR":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }

    const periodMovements = movements.filter((movement) =>
      isWithinInterval(new Date(movement.createdAt), { start, end })
    );

    return {
      start,
      end,
      movements: periodMovements,
    };
  }, [movements, selectedPeriod]);

  const stats = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const inStock = items.reduce((sum, item) => sum + item.inStock, 0);
    const out = totalItems - inStock;
    const utilization =
      totalItems > 0 ? Math.round((out / totalItems) * 100) : 0;

    const periodMovements = periodData.movements;
    const totalDispatches = periodMovements.length;
    const activeRentals = movements.filter(
      (m) => m.status !== "RETURNED"
    ).length;
    const completedReturns = periodMovements.filter(
      (m) => m.status === "RETURNED"
    ).length;
    const overdueReturns = movements.filter(
      (m) => m.status === "OUT" && new Date(m.expectedReturnAt) < new Date()
    ).length;

    return {
      totalItems,
      inStock,
      out,
      utilization,
      totalDispatches,
      activeRentals,
      completedReturns,
      overdueReturns,
    };
  }, [items, movements, periodData]);

  // Stock distribution by store
  const storeData = useMemo(() => {
    const bobaItems = items.filter((item) => item.store === "BOBA");
    const mikocheniItems = items.filter((item) => item.store === "MIKOCHENI");

    return [
      {
        name: "Boba",
        items: bobaItems.length,
        quantity: bobaItems.reduce((sum, item) => sum + item.quantity, 0),
        inStock: bobaItems.reduce((sum, item) => sum + item.inStock, 0),
      },
      {
        name: "Mikocheni",
        items: mikocheniItems.length,
        quantity: mikocheniItems.reduce((sum, item) => sum + item.quantity, 0),
        inStock: mikocheniItems.reduce((sum, item) => sum + item.inStock, 0),
      },
    ];
  }, [items]);

  // Movement trends over time
  const movementTrends = useMemo(() => {
    const trends = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      let periodStart: Date, periodEnd: Date, label: string;

      if (selectedPeriod === "WEEK") {
        periodStart = startOfWeek(subWeeks(now, i));
        periodEnd = endOfWeek(subWeeks(now, i));
        label = format(periodStart, "MMM dd");
      } else {
        periodStart = startOfMonth(subMonths(now, i));
        periodEnd = endOfMonth(subMonths(now, i));
        label = format(periodStart, "MMM yyyy");
      }

      const periodMovements = movements.filter((movement) =>
        isWithinInterval(new Date(movement.createdAt), {
          start: periodStart,
          end: periodEnd,
        })
      );

      trends.push({
        period: label,
        dispatches: periodMovements.length,
        returns: periodMovements.filter((m) => m.status === "RETURNED").length,
      });
    }

    return trends;
  }, [movements, selectedPeriod]);

  // Item type distribution
  const typeDistribution = useMemo(() => {
    const typeMap = new Map<string, number>();

    items.forEach((item) => {
      const type = item.type || "Other";
      typeMap.set(type, (typeMap.get(type) || 0) + item.quantity);
    });

    return Array.from(typeMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [items]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Wegesa Event Co - Inventory Report"],
      ["Generated:", new Date().toLocaleString()],
      [
        "Period:",
        `${selectedPeriod} (${format(
          periodData.start,
          "MMM dd, yyyy"
        )} - ${format(periodData.end, "MMM dd, yyyy")})`,
      ],
      [],
      ["Key Metrics"],
      ["Total Items", stats.totalItems],
      ["In Stock", stats.inStock],
      ["Out on Rental", stats.out],
      ["Utilization Rate", `${stats.utilization}%`],
      ["Total Dispatches (Period)", stats.totalDispatches],
      ["Active Rentals", stats.activeRentals],
      ["Completed Returns (Period)", stats.completedReturns],
      ["Overdue Returns", stats.overdueReturns],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Items sheet
    const itemsData = [
      [
        "Item Name",
        "Brand",
        "Type",
        "Store",
        "Total Quantity",
        "In Stock",
        "Out on Rental",
        "Date Added",
      ],
      ...items.map((item) => [
        item.name,
        item.brand || "",
        item.type || "",
        item.store,
        item.quantity,
        item.inStock,
        item.quantity - item.inStock,
        new Date(item.dateOfEntry).toLocaleDateString(),
      ]),
    ];

    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "Items");

    // Movements sheet
    const movementsData = [
      [
        "Movement ID",
        "Customer",
        "Location",
        "Store",
        "Status",
        "Items Count",
        "Created Date",
        "Expected Return",
        "Authorized By",
        "Issued By",
      ],
      ...periodData.movements.map((movement) => [
        movement.id,
        movement.customerName,
        movement.useLocation,
        movement.store,
        movement.status,
        movement.lines.length,
        new Date(movement.createdAt).toLocaleDateString(),
        new Date(movement.expectedReturnAt).toLocaleDateString(),
        movement.authorizedByUserId,
        movement.issuedByUserId,
      ]),
    ];

    const movementsSheet = XLSX.utils.aoa_to_sheet(movementsData);
    XLSX.utils.book_append_sheet(workbook, movementsSheet, "Movements");

    // Save file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      data,
      `Wegesa_Inventory_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );

    toast.success("Excel report exported successfully!");
  };

  const sendEmailReport = () => {
    // Mock email functionality
    exportToExcel();
    toast.success("Report exported and ready to email!", {
      description:
        "The Excel file has been downloaded. Attach it to your email.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your inventory operations
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={sendEmailReport}>
            <EnvelopeIcon className="mr-2 h-4 w-4" />
            Email Report
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedPeriod}
            onValueChange={(value: string) =>
              setSelectedPeriod(value as ReportPeriod)
            }
          >
            <TabsList>
              <TabsTrigger value="WEEK">This Week</TabsTrigger>
              <TabsTrigger value="MONTH">This Month</TabsTrigger>
              <TabsTrigger value="QUARTER">This Quarter</TabsTrigger>
              <TabsTrigger value="YEAR">This Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground mt-2">
            {format(periodData.start, "MMM dd, yyyy")} -{" "}
            {format(periodData.end, "MMM dd, yyyy")}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Utilization Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.utilization}%</div>
                {stats.utilization > 75 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-orange-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.out} of {stats.totalItems} items out
              </p>
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
              <CardTitle className="text-sm font-medium">
                Dispatches ({selectedPeriod.toLowerCase()})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDispatches}</div>
              <p className="text-xs text-muted-foreground">
                New rentals this period
              </p>
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
                Active Rentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRentals}</div>
              <p className="text-xs text-muted-foreground">
                Currently outstanding
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            className={stats.overdueReturns > 0 ? "border-destructive" : ""}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.overdueReturns > 0 ? "text-destructive" : ""
                }`}
              >
                {stats.overdueReturns}
              </div>
              <p className="text-xs text-muted-foreground">
                Past expected return date
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Store Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Store</CardTitle>
              <CardDescription>
                Distribution of items across locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="quantity"
                      fill="#000000"
                      name="Total Quantity"
                    />
                    <Bar dataKey="inStock" fill="#808080" name="In Stock" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Item Types */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Items by Type</CardTitle>
              <CardDescription>
                Breakdown of inventory categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Movement Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Movement Trends</CardTitle>
            <CardDescription>
              Dispatch and return activity over the last 7{" "}
              {selectedPeriod === "WEEK" ? "weeks" : "months"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="dispatches"
                    stroke="#000000"
                    strokeWidth={2}
                    name="Dispatches"
                  />
                  <Line
                    type="monotone"
                    dataKey="returns"
                    stroke="#808080"
                    strokeWidth={2}
                    name="Returns"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
          <CardDescription>
            Detailed breakdown for {format(periodData.start, "MMM dd")} -{" "}
            {format(periodData.end, "MMM dd, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Inventory Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span>{stats.totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Stock:</span>
                  <span className="text-green-600">{stats.inStock}</span>
                </div>
                <div className="flex justify-between">
                  <span>Out on Rental:</span>
                  <span className="text-orange-600">{stats.out}</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilization Rate:</span>
                  <span className="font-medium">{stats.utilization}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Movement Activity</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>New Dispatches:</span>
                  <span>{stats.totalDispatches}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Returns:</span>
                  <span className="text-green-600">
                    {stats.completedReturns}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Rentals:</span>
                  <span>{stats.activeRentals}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Returns:</span>
                  <span
                    className={
                      stats.overdueReturns > 0
                        ? "text-destructive font-medium"
                        : ""
                    }
                  >
                    {stats.overdueReturns}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
