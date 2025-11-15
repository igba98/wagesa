"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/store/app-store";
import { can } from "@/lib/roles";
import { BookedEvent, EventType } from "@/lib/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths, startOfYear, endOfYear, parseISO } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type CalendarView = "MONTH" | "WEEK" | "YEAR";

export default function BookingsPage() {
  const { currentUser, bookedEvents, addBooking, updateBooking, deleteBooking } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEventType, setFilterEventType] = useState<EventType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookedEvent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("MONTH");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    eventDate: "",
    eventType: "WEDDING" as EventType,
    venue: "",
    amount: 0,
    isPaid: false,
    notes: "",
    status: "CONFIRMED" as "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED",
  });

  if (!currentUser) return null;

  const canCreate = can.createBooking(currentUser.role);
  const canEdit = can.editBooking(currentUser.role);
  const canDelete = can.deleteBooking(currentUser.role);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookedEvents.filter((booking) => {
      const matchesSearch =
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.venue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterEventType === "ALL" || booking.eventType === filterEventType;
      const matchesStatus = filterStatus === "ALL" || booking.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [bookedEvents, searchTerm, filterEventType, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = bookedEvents.length;
    const confirmed = bookedEvents.filter((b) => b.status === "CONFIRMED").length;
    const pending = bookedEvents.filter((b) => b.status === "PENDING").length;
    const completed = bookedEvents.filter((b) => b.status === "COMPLETED").length;
    const totalRevenue = bookedEvents
      .filter((b) => b.isPaid && b.status !== "CANCELLED")
      .reduce((sum, b) => sum + b.amount, 0);
    const pendingPayments = bookedEvents
      .filter((b) => !b.isPaid && b.status !== "CANCELLED")
      .reduce((sum, b) => sum + b.amount, 0);

    // Event type breakdown
    const weddings = bookedEvents.filter((b) => b.eventType === "WEDDING").length;
    const corporate = bookedEvents.filter((b) => b.eventType === "CORPORATE").length;
    const sendoffs = bookedEvents.filter((b) => b.eventType === "SENDOFF").length;

    return { total, confirmed, pending, completed, totalRevenue, pendingPayments, weddings, corporate, sendoffs };
  }, [bookedEvents]);

  // Calendar helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) => {
    return bookedEvents.filter((booking) =>
      isSameDay(parseISO(booking.eventDate), date)
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenDialog = (booking?: BookedEvent, presetDate?: Date) => {
    if (booking) {
      setSelectedBooking(booking);
      setFormData({
        customerName: booking.customerName,
        customerPhone: booking.customerPhone || "",
        customerEmail: booking.customerEmail || "",
        eventDate: booking.eventDate.split("T")[0],
        eventType: booking.eventType,
        venue: booking.venue,
        amount: booking.amount,
        isPaid: booking.isPaid,
        notes: booking.notes || "",
        status: booking.status,
      });
    } else {
      setSelectedBooking(null);
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        eventDate: presetDate ? format(presetDate, "yyyy-MM-dd") : "",
        eventType: "WEDDING",
        venue: "",
        amount: 0,
        isPaid: false,
        notes: "",
        status: "CONFIRMED",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.customerName || !formData.eventDate || !formData.venue) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      const bookingData = {
        ...formData,
        currency: "TZS",
        createdBy: currentUser.id,
      };

      if (selectedBooking) {
        updateBooking(selectedBooking.id, bookingData);
        toast.success("Booking updated successfully!");
      } else {
        addBooking(bookingData);
        toast.success("Booking created successfully!");
      }

      setIsDialogOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!selectedBooking) return;
    deleteBooking(selectedBooking.id);
    toast.success("Booking deleted successfully!");
    setIsDeleteDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleExportExcel = () => {
    const exportData = filteredBookings.map((booking) => ({
      Customer: booking.customerName,
      Phone: booking.customerPhone || "",
      Email: booking.customerEmail || "",
      "Event Date": format(new Date(booking.eventDate), "PP"),
      "Event Type": booking.eventType,
      Venue: booking.venue,
      Amount: booking.amount,
      Currency: booking.currency,
      "Payment Status": booking.isPaid ? "Paid" : "Pending",
      Status: booking.status,
      Notes: booking.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `bookings_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );
    toast.success("Bookings exported successfully!");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
      CONFIRMED: { variant: "default", icon: CheckCircleIcon },
      PENDING: { variant: "outline", icon: ClockIcon },
      CANCELLED: { variant: "destructive", icon: XCircleIcon },
      COMPLETED: { variant: "secondary", icon: CheckCircleIcon },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getEventTypeColor = (type: EventType) => {
    const colors: Record<EventType, string> = {
      WEDDING: "bg-pink-500",
      SENDOFF: "bg-purple-500",
      CORPORATE: "bg-blue-500",
      RENTALS: "bg-green-500",
      OTHER: "bg-gray-500",
    };
    return colors[type];
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Event Bookings</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage event bookings and calendar
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.confirmed} confirmed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalRevenue.toLocaleString()} TZS
            </div>
            <p className="text-xs text-muted-foreground mt-1">From paid bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.pendingPayments.toLocaleString()} TZS
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookedEvents.filter((b) => 
                isSameMonth(parseISO(b.eventDate), new Date())
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled events</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Weddings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weddings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Corporate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.corporate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sendoffs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sendoffs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Calendar and List View */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        {/* CALENDAR VIEW */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center min-w-[200px]">
                    <h2 className="text-lg font-semibold">
                      {format(currentDate, "MMMM yyyy")}
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleToday}>
                    Today
                  </Button>
                  {canCreate && (
                    <Button size="sm" onClick={() => handleOpenDialog()} className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      New Booking
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="bg-muted p-2 text-center text-xs font-semibold"
                  >
                    {day}
                  </div>
                ))}
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  const eventsOnDay = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={index}
                      onClick={() => canCreate && handleOpenDialog(undefined, day)}
                      className={`
                        bg-card p-2 min-h-[80px] sm:min-h-[100px] cursor-pointer transition-colors
                        ${!isCurrentMonth ? "opacity-40" : ""}
                        ${isTodayDate ? "ring-2 ring-primary" : ""}
                        hover:bg-muted/50
                      `}
                    >
                      <div
                        className={`
                          text-sm font-medium mb-1
                          ${isTodayDate ? "text-primary font-bold" : ""}
                        `}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {eventsOnDay.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              canEdit && handleOpenDialog(event);
                            }}
                            className={`
                              text-xs px-1 py-0.5 rounded truncate text-white
                              ${getEventTypeColor(event.eventType)}
                            `}
                            title={`${event.customerName} - ${event.venue}`}
                          >
                            {event.customerName}
                          </div>
                        ))}
                        {eventsOnDay.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{eventsOnDay.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded ${getEventTypeColor("WEDDING")}`}></div>
                  <span className="text-sm">Wedding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded ${getEventTypeColor("CORPORATE")}`}></div>
                  <span className="text-sm">Corporate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded ${getEventTypeColor("SENDOFF")}`}></div>
                  <span className="text-sm">Sendoff</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded ${getEventTypeColor("RENTALS")}`}></div>
                  <span className="text-sm">Rentals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded ${getEventTypeColor("OTHER")}`}></div>
                  <span className="text-sm">Other</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIST VIEW */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>All Bookings</CardTitle>
                  <CardDescription>
                    Showing {filteredBookings.length} of {bookedEvents.length} bookings
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  {canCreate && (
                    <Button size="sm" onClick={() => handleOpenDialog()} className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      New Booking
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer or venue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterEventType} onValueChange={(value: string) => setFilterEventType(value as EventType | "ALL")}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="WEDDING">Wedding</SelectItem>
                    <SelectItem value="SENDOFF">Sendoff</SelectItem>
                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                    <SelectItem value="RENTALS">Rentals</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value: string) => setFilterStatus(value as any)}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Event Date</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Venue</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings
                        .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                        .map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              <div>{booking.customerName}</div>
                              <div className="text-xs text-muted-foreground md:hidden">
                                {format(new Date(booking.eventDate), "PP")}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {format(new Date(booking.eventDate), "PP")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{booking.eventType}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {booking.venue}
                            </TableCell>
                            <TableCell>
                              <div>
                                {booking.amount.toLocaleString()} {booking.currency}
                              </div>
                              <div className="text-xs">
                                {booking.isPaid ? (
                                  <Badge variant="default" className="gap-1 text-xs">
                                    <CheckCircleIcon className="h-2.5 w-2.5" />
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1 text-xs">
                                    <ClockIcon className="h-2.5 w-2.5" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(booking)}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBooking ? "Edit Booking" : "Create New Booking"}
            </DialogTitle>
            <DialogDescription>
              Fill in the event booking details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="+255 712 345 678"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, customerEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value: EventType) =>
                    setFormData({ ...formData, eventType: value })
                  }
                >
                  <SelectTrigger id="eventType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEDDING">Wedding</SelectItem>
                    <SelectItem value="SENDOFF">Sendoff</SelectItem>
                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                    <SelectItem value="RENTALS">Rentals</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (TZS) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPaid"
                    checked={formData.isPaid}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPaid: checked as boolean })
                    }
                  />
                  <Label htmlFor="isPaid" className="cursor-pointer">
                    Payment received
                  </Label>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : selectedBooking
                  ? "Update Booking"
                  : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the booking for{" "}
              <strong>{selectedBooking?.customerName}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


