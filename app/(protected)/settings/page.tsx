"use client";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Cog6ToothIcon,
  ShieldExclamationIcon,
  BuildingStorefrontIcon,
  BellIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function SettingsPage() {
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  // Mock settings state
  const [settings, setSettings] = useState({
    companyName: "Wagesa Event Co",
    defaultStore: "BOBA",
    emailNotifications: true,
    smsNotifications: false,
    overdueAlerts: true,
    lowStockAlerts: true,
    lowStockThreshold: 10,
    defaultRentalPeriod: 3,
    autoEmailReports: false,
    reportFrequency: "weekly",
  });

  const canManageSettings = can.manageSettings(
    currentUser?.role || "STORE_KEEPER"
  );

  if (!canManageSettings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            System configuration and preferences
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <ShieldExclamationIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Access Denied</p>
              <p className="text-sm">
                You don't have permission to access system settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setIsLoading(true);

    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Settings saved successfully!");
    setIsLoading(false);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences and business settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingStorefrontIcon className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => updateSetting("companyName", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="defaultStore">Default Store</Label>
                <select
                  id="defaultStore"
                  value={settings.defaultStore}
                  onChange={(e) =>
                    updateSetting("defaultStore", e.target.value)
                  }
                  className="w-full h-10 px-3 border border-input bg-background rounded-md"
                >
                  <option value="BOBA">Boba</option>
                  <option value="MIKOCHENI">Mikocheni</option>
                </select>
              </div>

              <div>
                <Label htmlFor="rentalPeriod">
                  Default Rental Period (days)
                </Label>
                <Input
                  id="rentalPeriod"
                  type="number"
                  min="1"
                  value={settings.defaultRentalPeriod}
                  onChange={(e) =>
                    updateSetting(
                      "defaultRentalPeriod",
                      parseInt(e.target.value) || 3
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure alert and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("emailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("smsNotifications", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when items are overdue for return
                  </p>
                </div>
                <Switch
                  checked={settings.overdueAlerts}
                  onCheckedChange={(checked) =>
                    updateSetting("overdueAlerts", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when inventory is running low
                  </p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    updateSetting("lowStockAlerts", checked)
                  }
                />
              </div>

              {settings.lowStockAlerts && (
                <div>
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="1"
                    value={settings.lowStockThreshold}
                    onChange={(e) =>
                      updateSetting(
                        "lowStockThreshold",
                        parseInt(e.target.value) || 10
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when stock falls below this number
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reports */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                Reports
              </CardTitle>
              <CardDescription>
                Configure automated reporting preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Email Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send periodic reports
                  </p>
                </div>
                <Switch
                  checked={settings.autoEmailReports}
                  onCheckedChange={(checked) =>
                    updateSetting("autoEmailReports", checked)
                  }
                />
              </div>

              {settings.autoEmailReports && (
                <div>
                  <Label htmlFor="reportFrequency">Report Frequency</Label>
                  <select
                    id="reportFrequency"
                    value={settings.reportFrequency}
                    onChange={(e) =>
                      updateSetting("reportFrequency", e.target.value)
                    }
                    className="w-full h-10 px-3 border border-input bg-background rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog6ToothIcon className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                Current system status and version details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Version</Label>
                  <p className="font-mono">v1.0.0</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Environment</Label>
                  <Badge variant="secondary">Development</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data Storage</Label>
                  <Badge variant="outline">In-Memory</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground">Current User</Label>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{currentUser?.name}</span>
                  <Badge variant="secondary">
                    {currentUser?.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Warning Note */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-orange-100 p-1 dark:bg-orange-900">
              <Cog6ToothIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Development Version
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                This is a frontend-only prototype. Settings are stored in memory
                and will be lost on page refresh. In production, these settings
                would be persisted to a database.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
