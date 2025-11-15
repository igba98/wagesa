"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/store/app-store";
import { can } from "@/lib/roles";
import { Invoice, InvoiceItem, InvoiceStatus, Transaction, TransactionType } from "@/lib/types";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon,
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
import { Separator } from "@/components/ui/separator";

export default function FinancePage() {
  const { currentUser, invoices, transactions, addInvoice, updateInvoice, deleteInvoice, addTransaction, updateTransaction, deleteTransaction } = useApp();
  
  // Invoice state
  const [searchTermInvoice, setSearchTermInvoice] = useState("");
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);
  const [isDeleteInvoiceDialogOpen, setIsDeleteInvoiceDialogOpen] = useState(false);

  // Transaction state
  const [searchTermTransaction, setSearchTermTransaction] = useState("");
  const [filterTransactionType, setFilterTransactionType] = useState<TransactionType | "ALL">("ALL");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleteTransactionDialogOpen, setIsDeleteTransactionDialogOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
    taxRate: 18,
    status: "DRAFT" as InvoiceStatus,
    issueDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    notes: "",
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: "INCOME" as TransactionType,
    description: "",
    amount: 0,
    category: "",
    reference: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  if (!currentUser) return null;

  // Permission checks
  const canCreateInvoice = can.createInvoice(currentUser.role);
  const canEditInvoice = can.editInvoice(currentUser.role);
  const canDeleteInvoice = can.deleteInvoice(currentUser.role);
  const canAddTransaction = can.addTransaction(currentUser.role);
  const canEditTransaction = can.editTransaction(currentUser.role);
  const canDeleteTransaction = can.deleteTransaction(currentUser.role);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTermInvoice.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTermInvoice.toLowerCase());
      const matchesStatus = filterInvoiceStatus === "ALL" || inv.status === filterInvoiceStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTermInvoice, filterInvoiceStatus]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.description.toLowerCase().includes(searchTermTransaction.toLowerCase()) ||
        txn.category?.toLowerCase().includes(searchTermTransaction.toLowerCase()) ||
        txn.reference?.toLowerCase().includes(searchTermTransaction.toLowerCase());
      const matchesType = filterTransactionType === "ALL" || txn.type === filterTransactionType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTermTransaction, filterTransactionType]);

  // Stats
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === "PAID").length;
    const overdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE").length;
    const totalRevenue = invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalIncome = transactions
      .filter((txn) => txn.type === "INCOME")
      .reduce((sum, txn) => sum + txn.amount, 0);
    const totalExpense = transactions
      .filter((txn) => txn.type === "EXPENSE")
      .reduce((sum, txn) => sum + txn.amount, 0);
    const netProfit = totalIncome - totalExpense;

    return {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      totalIncome,
      totalExpense,
      netProfit,
    };
  }, [invoices, transactions]);

  // Calculate invoice totals
  const calculateInvoiceTotals = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  // Invoice handlers
  const handleOpenInvoiceDialog = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setInvoiceForm({
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail || "",
        customerPhone: invoice.customerPhone || "",
        customerAddress: invoice.customerAddress || "",
        items: invoice.items,
        taxRate: invoice.taxRate,
        status: invoice.status,
        issueDate: invoice.issueDate.split("T")[0],
        dueDate: invoice.dueDate.split("T")[0],
        notes: invoice.notes || "",
      });
    } else {
      setSelectedInvoice(null);
      setInvoiceForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        taxRate: 18,
        status: "DRAFT",
        issueDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
        notes: "",
      });
    }
    setIsInvoiceDialogOpen(true);
  };

  const handleInvoiceItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total for this item
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }],
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceForm.items.length === 1) {
      toast.error("Invoice must have at least one item");
      return;
    }
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!invoiceForm.customerName) {
        toast.error("Customer name is required");
        setIsSubmitting(false);
        return;
      }

      if (invoiceForm.items.length === 0 || invoiceForm.items.some(item => !item.description)) {
        toast.error("Please add at least one item with description");
        setIsSubmitting(false);
        return;
      }

      const { subtotal, taxAmount, total } = calculateInvoiceTotals(invoiceForm.items, invoiceForm.taxRate);

      const invoiceData = {
        ...invoiceForm,
        subtotal,
        taxAmount,
        total,
        currency: "TZS",
        createdBy: currentUser.id,
      };

      if (selectedInvoice) {
        updateInvoice(selectedInvoice.id, invoiceData);
        toast.success("Invoice updated successfully!");
      } else {
        addInvoice(invoiceData);
        toast.success("Invoice created successfully!");
      }

      setIsInvoiceDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvoice = () => {
    if (!selectedInvoice) return;
    deleteInvoice(selectedInvoice.id);
    toast.success("Invoice deleted successfully!");
    setIsDeleteInvoiceDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setInvoiceToView(invoice);
    setIsViewInvoiceOpen(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("WEGESA EVENT CO", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("INVOICE", 105, 30, { align: "center" });
    
    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 45);
    doc.text(`Issue Date: ${format(new Date(invoice.issueDate), "PP")}`, 20, 52);
    doc.text(`Due Date: ${format(new Date(invoice.dueDate), "PP")}`, 20, 59);
    
    // Customer details
    doc.text(`Bill To:`, 20, 72);
    doc.text(invoice.customerName, 20, 79);
    if (invoice.customerAddress) doc.text(invoice.customerAddress, 20, 86);
    if (invoice.customerPhone) doc.text(invoice.customerPhone, 20, 93);
    
    // Items table header
    let yPos = 110;
    doc.text("Description", 20, yPos);
    doc.text("Qty", 120, yPos);
    doc.text("Price", 145, yPos);
    doc.text("Total", 175, yPos, { align: "right" });
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 7;
    
    // Items
    invoice.items.forEach((item) => {
      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(item.unitPrice.toLocaleString(), 145, yPos);
      doc.text(item.total.toLocaleString(), 175, yPos, { align: "right" });
      yPos += 7;
    });
    
    // Totals
    yPos += 10;
    doc.text(`Subtotal:`, 130, yPos);
    doc.text(`${invoice.subtotal.toLocaleString()} ${invoice.currency}`, 175, yPos, { align: "right" });
    yPos += 7;
    doc.text(`Tax (${invoice.taxRate}%):`, 130, yPos);
    doc.text(`${invoice.taxAmount.toLocaleString()} ${invoice.currency}`, 175, yPos, { align: "right" });
    yPos += 7;
    doc.setFontSize(12);
    doc.text(`Total:`, 130, yPos);
    doc.text(`${invoice.total.toLocaleString()} ${invoice.currency}`, 175, yPos, { align: "right" });
    
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
    toast.success("Invoice downloaded successfully!");
  };

  // Transaction handlers
  const handleOpenTransactionDialog = (transaction?: Transaction) => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setTransactionForm({
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category || "",
        reference: transaction.reference || "",
        date: transaction.date.split("T")[0],
      });
    } else {
      setSelectedTransaction(null);
      setTransactionForm({
        type: "INCOME",
        description: "",
        amount: 0,
        category: "",
        reference: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    }
    setIsTransactionDialogOpen(true);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!transactionForm.description || transactionForm.amount <= 0) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      const transactionData = {
        ...transactionForm,
        currency: "TZS",
        createdBy: currentUser.id,
      };

      if (selectedTransaction) {
        updateTransaction(selectedTransaction.id, transactionData);
        toast.success("Transaction updated successfully!");
      } else {
        addTransaction(transactionData);
        toast.success("Transaction added successfully!");
      }

      setIsTransactionDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    deleteTransaction(selectedTransaction.id);
    toast.success("Transaction deleted successfully!");
    setIsDeleteTransactionDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleExportInvoicesExcel = () => {
    const exportData = filteredInvoices.map((inv) => ({
      "Invoice #": inv.invoiceNumber,
      Customer: inv.customerName,
      "Issue Date": format(new Date(inv.issueDate), "PP"),
      "Due Date": format(new Date(inv.dueDate), "PP"),
      Subtotal: inv.subtotal,
      Tax: inv.taxAmount,
      Total: inv.total,
      Currency: inv.currency,
      Status: inv.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `invoices_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );
    toast.success("Invoices exported successfully!");
  };

  const handleExportTransactionsExcel = () => {
    const exportData = filteredTransactions.map((txn) => ({
      Date: format(new Date(txn.date), "PP"),
      Type: txn.type,
      Description: txn.description,
      Amount: txn.amount,
      Currency: txn.currency,
      Category: txn.category || "",
      Reference: txn.reference || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `transactions_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );
    toast.success("Transactions exported successfully!");
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants: Record<InvoiceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      DRAFT: { variant: "secondary", label: "Draft" },
      SENT: { variant: "outline", label: "Sent" },
      PAID: { variant: "default", label: "Paid" },
      OVERDUE: { variant: "destructive", label: "Overdue" },
      CANCELLED: { variant: "secondary", label: "Cancelled" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage invoices, income, and expenses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString()} TZS
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.paidInvoices} paid invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalIncome.toLocaleString()} TZS
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.totalExpense.toLocaleString()} TZS
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {stats.netProfit.toLocaleString()} TZS
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Invoices and Transactions */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>
                    Showing {filteredInvoices.length} of {invoices.length} invoices
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportInvoicesExcel}
                    className="gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  {canCreateInvoice && (
                    <Button size="sm" onClick={() => handleOpenInvoiceDialog()} className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Create Invoice
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
                    placeholder="Search by invoice # or customer..."
                    value={searchTermInvoice}
                    onChange={(e) => setSearchTermInvoice(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterInvoiceStatus} onValueChange={(value: string) => setFilterInvoiceStatus(value as InvoiceStatus | "ALL")}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoices Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                      <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(invoice.issueDate), "PP")}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {format(new Date(invoice.dueDate), "PP")}
                          </TableCell>
                          <TableCell>
                            {invoice.total.toLocaleString()} {invoice.currency}
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintInvoice(invoice)}
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </Button>
                              {canEditInvoice && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenInvoiceDialog(invoice)}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              )}
                              {canDeleteInvoice && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setIsDeleteInvoiceDialogOpen(true);
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

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportTransactionsExcel}
                    className="gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  {canAddTransaction && (
                    <Button size="sm" onClick={() => handleOpenTransactionDialog()} className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Add Transaction
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
                    placeholder="Search transactions..."
                    value={searchTermTransaction}
                    onChange={(e) => setSearchTermTransaction(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterTransactionType} onValueChange={(value: string) => setFilterTransactionType(value as TransactionType | "ALL")}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="hidden lg:table-cell">Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === "INCOME" ? "default" : "secondary"}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {transaction.category || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {transaction.reference || "-"}
                          </TableCell>
                          <TableCell className={transaction.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                            {transaction.type === "INCOME" ? "+" : "-"}
                            {transaction.amount.toLocaleString()} {transaction.currency}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {canEditTransaction && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenTransactionDialog(transaction)}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              )}
                              {canDeleteTransaction && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setIsDeleteTransactionDialogOpen(true);
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

      {/* Invoice Form Dialog - Part 1 */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? "Edit Invoice" : "Create New Invoice"}
            </DialogTitle>
            <DialogDescription>
              Fill in the invoice details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitInvoice} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={invoiceForm.customerName}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, customerName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={invoiceForm.customerEmail}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={invoiceForm.customerPhone}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, customerPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={invoiceForm.customerAddress}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Invoice Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddInvoiceItem}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              {invoiceForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-5 space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleInvoiceItemChange(index, "description", e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleInvoiceItemChange(index, "quantity", Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleInvoiceItemChange(index, "unitPrice", Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-2">
                    <Label>Total</Label>
                    <Input
                      value={item.total.toLocaleString()}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInvoiceItem(index)}
                      disabled={invoiceForm.items.length === 1}
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals and Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={invoiceForm.issueDate}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={invoiceForm.status}
                    onValueChange={(value: InvoiceStatus) =>
                      setInvoiceForm({ ...invoiceForm, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={invoiceForm.taxRate}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, taxRate: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {calculateInvoiceTotals(invoiceForm.items, invoiceForm.taxRate).subtotal.toLocaleString()} TZS
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({invoiceForm.taxRate}%):</span>
                    <span className="font-medium">
                      {calculateInvoiceTotals(invoiceForm.items, invoiceForm.taxRate).taxAmount.toLocaleString()} TZS
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total:</span>
                    <span>
                      {calculateInvoiceTotals(invoiceForm.items, invoiceForm.taxRate).total.toLocaleString()} TZS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={invoiceForm.notes}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, notes: e.target.value })
                }
                placeholder="Additional notes or payment terms..."
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInvoiceDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : selectedInvoice
                  ? "Update Invoice"
                  : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewInvoiceOpen} onOpenChange={setIsViewInvoiceOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {invoiceToView && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice {invoiceToView.invoiceNumber}</DialogTitle>
                <DialogDescription>
                  {getStatusBadge(invoiceToView.status)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Issue Date</p>
                    <p className="font-medium">{format(new Date(invoiceToView.issueDate), "PP")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{format(new Date(invoiceToView.dueDate), "PP")}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Bill To:</h4>
                  <p className="font-medium">{invoiceToView.customerName}</p>
                  {invoiceToView.customerEmail && <p className="text-sm text-muted-foreground">{invoiceToView.customerEmail}</p>}
                  {invoiceToView.customerPhone && <p className="text-sm text-muted-foreground">{invoiceToView.customerPhone}</p>}
                  {invoiceToView.customerAddress && <p className="text-sm text-muted-foreground">{invoiceToView.customerAddress}</p>}
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Items:</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceToView.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{invoiceToView.subtotal.toLocaleString()} {invoiceToView.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({invoiceToView.taxRate}%):</span>
                    <span className="font-medium">{invoiceToView.taxAmount.toLocaleString()} {invoiceToView.currency}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{invoiceToView.total.toLocaleString()} {invoiceToView.currency}</span>
                  </div>
                </div>
                {invoiceToView.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes:</h4>
                    <p className="text-sm text-muted-foreground">{invoiceToView.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => handlePrintInvoice(invoiceToView)}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print/Download
                </Button>
                <Button onClick={() => setIsViewInvoiceOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Form Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? "Edit Transaction" : "Add New Transaction"}
            </DialogTitle>
            <DialogDescription>
              Record income or expense transaction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="txnType">Type *</Label>
              <Select
                value={transactionForm.type}
                onValueChange={(value: TransactionType) =>
                  setTransactionForm({ ...transactionForm, type: value })
                }
              >
                <SelectTrigger id="txnType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txnDescription">Description *</Label>
              <Input
                id="txnDescription"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm({ ...transactionForm, description: e.target.value })
                }
                placeholder="Payment for services, equipment purchase, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txnAmount">Amount (TZS) *</Label>
              <Input
                id="txnAmount"
                type="number"
                min="0"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({ ...transactionForm, amount: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txnCategory">Category</Label>
              <Input
                id="txnCategory"
                value={transactionForm.category}
                onChange={(e) =>
                  setTransactionForm({ ...transactionForm, category: e.target.value })
                }
                placeholder="Salary, Equipment, Client Payment, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txnReference">Reference</Label>
              <Input
                id="txnReference"
                value={transactionForm.reference}
                onChange={(e) =>
                  setTransactionForm({ ...transactionForm, reference: e.target.value })
                }
                placeholder="Invoice #, Receipt #, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txnDate">Date *</Label>
              <Input
                id="txnDate"
                type="date"
                value={transactionForm.date}
                onChange={(e) =>
                  setTransactionForm({ ...transactionForm, date: e.target.value })
                }
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransactionDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : selectedTransaction
                  ? "Update Transaction"
                  : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Dialog */}
      <AlertDialog open={isDeleteInvoiceDialogOpen} onOpenChange={setIsDeleteInvoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice{" "}
              <strong>{selectedInvoice?.invoiceNumber}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Transaction Dialog */}
      <AlertDialog open={isDeleteTransactionDialogOpen} onOpenChange={setIsDeleteTransactionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


