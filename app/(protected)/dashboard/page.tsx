"use client";
import { useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PlusIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { isAfter } from "date-fns";

export default function DashboardPage() {
  const { items, movements, currentUser } = useApp();

  const stats = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const inStock = items.reduce((sum, item) => sum + item.inStock, 0);
    const out = totalItems - inStock;
    const activeRentals = movements.filter(
      (m) => m.status !== "RETURNED"
    ).length;
    const overdueReturns = movements.filter(
      (m) =>
        m.status === "OUT" && isAfter(new Date(), new Date(m.expectedReturnAt))
    ).length;

    return {
      totalItems,
      inStock,
      out,
      activeRentals,
      overdueReturns,
    };
  }, [items, movements]);

  const recentMovements = movements
    .slice(0, 5)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const quickActions = [
    {
      title: "New Dispatch",
      description: "Create a new rental dispatch",
      href: "/movements/new",
      icon: PlusIcon,
      color: "bg-blue-500",
      permission: "createDispatch" as const,
    },
    {
      title: "Register Return",
      description: "Process returned items",
      href: "/movements",
      icon: ArrowPathIcon,
      color: "bg-green-500",
      permission: "confirmReturn" as const,
    },
    {
      title: "Add Item",
      description: "Add new inventory item",
      href: "/inventory",
      icon: ClipboardDocumentListIcon,
      color: "bg-purple-500",
      permission: "addItem" as const,
    },
    {
      title: "View Reports",
      description: "Analytics and insights",
      href: "/reports",
      icon: ChartBarIcon,
      color: "bg-orange-500",
      permission: "viewReports" as const,
    },
    {
      title: "Manage Users",
      description: "User administration",
      href: "/users",
      icon: UserPlusIcon,
      color: "bg-pink-500",
      permission: "manageUsers" as const,
    },
  ];

  const availableActions = quickActions.filter((action) =>
    can[action.permission](currentUser?.role || "STORE_KEEPER")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome back, {currentUser?.name}. Here's your inventory overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <ClipboardDocumentListIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-xl lg:text-2xl font-bold">
                {stats.totalItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all categories
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-xl lg:text-2xl font-bold">
                {stats.inStock}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for rental
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out on Rental
              </CardTitle>
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">{stats.out}</div>
              <p className="text-xs text-muted-foreground">
                Currently rented out
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Rentals
              </CardTitle>
              <ArrowPathIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {stats.activeRentals}
              </div>
              <p className="text-xs text-muted-foreground">
                Ongoing dispatches
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card
            className={stats.overdueReturns > 0 ? "border-destructive" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <ExclamationTriangleIcon
                className={`h-4 w-4 ${
                  stats.overdueReturns > 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-xl lg:text-2xl font-bold ${
                  stats.overdueReturns > 0 ? "text-destructive" : ""
                }`}
              >
                {stats.overdueReturns}
              </div>
              <p className="text-xs text-muted-foreground">
                Past expected return
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks based on your role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 hover:bg-muted"
                  >
                    <div className={`mr-3 rounded-lg p-2 ${action.color}`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
              <CardDescription>
                Latest dispatch and return activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentMovements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowPathIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent movements</p>
                  <p className="text-sm">
                    Create your first dispatch to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMovements.map((movement, index) => (
                    <div key={movement.id}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {movement.customerName}
                            </span>
                            <Badge
                              variant={
                                movement.status === "RETURNED"
                                  ? "default"
                                  : movement.status === "PARTIAL_RETURN"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {movement.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {movement.useLocation} • {movement.lines.length}{" "}
                            items
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {index < recentMovements.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
