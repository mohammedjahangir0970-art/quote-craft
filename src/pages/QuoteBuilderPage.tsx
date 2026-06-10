import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Save, Send, Loader2, ArrowLeft } from "lucide-react"
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { TRADE_CATEGORIES } from "@contracts/constants"
import { toast } from "sonner"

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export default function QuoteBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const quoteId = id ? parseInt(id, 10) : null
  const isEditing = !!quoteId

  // Form state
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [trade, setTrade] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [taxRate, setTaxRate] = useState(20)
  const [includeTax, setIncludeTax] = useState(false)

  // Load existing quote if editing
  const { data: existingQuote, isLoading: isLoadingQuote } = trpc.quote.getById.useQuery(
    { id: quoteId! },
    { enabled: isEditing }
  )

  // Populate form when editing
  useEffect(() => {
    if (existingQuote) {
      setCustomerName(existingQuote.customerName || "")
      setCustomerEmail(existingQuote.customerEmail || "")
      setCustomerPhone(existingQuote.customerPhone || "")
      setCustomerAddress(existingQuote.customerAddress || "")
      setTrade(existingQuote.trade || "")
      setServiceName(existingQuote.serviceName || "")
      setJobDescription(existingQuote.jobDescription || "")
      setNotes(existingQuote.notes || "")
      setTaxRate(Number(existingQuote.taxRate) || 20)
      setIncludeTax(existingQuote.includeTax || false)
      if (existingQuote.items) {
        setLineItems(
          existingQuote.items.map((item) => ({
            id: crypto.randomUUID(),
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          }))
        )
      }
    }
  }, [existingQuote])

  const utils = trpc.useUtils()

  const createQuote = trpc.quote.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Quote ${data.quoteNumber} created successfully`)
      utils.quote.list.invalidate()
      navigate("/dashboard")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create quote")
    },
  })

  const updateQuote = trpc.quote.update.useMutation({
    onSuccess: () => {
      toast.success("Quote updated successfully")
      utils.quote.list.invalidate()
      utils.quote.getById.invalidate({ id: quoteId! })
      navigate("/dashboard")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update quote")
    },
  })

  const isSaving = createQuote.isPending || updateQuote.isPending

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const taxAmount = includeTax ? subtotal * (taxRate / 100) : 0
  const total = subtotal + taxAmount

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save quotes")
      navigate("/login")
      return
    }
    if (!customerName.trim()) {
      toast.error("Customer name is required")
      return
    }
    if (lineItems.length === 0) {
      toast.error("Add at least one line item")
      return
    }
    if (lineItems.some((item) => !item.description.trim())) {
      toast.error("All line items need a description")
      return
    }

    const payload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      trade: trade || undefined,
      serviceName: serviceName || undefined,
      jobDescription: jobDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      taxRate,
      includeTax,
      subtotal,
      taxAmount,
      total,
      items: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    }

    if (isEditing) {
      updateQuote.mutate({ id: quoteId!, ...payload })
    } else {
      createQuote.mutate(payload)
    }
  }

  if (isLoadingQuote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isEditing ? "Edit Quote" : "Quote Builder"}
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Quote
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Main St, City"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service & Trade Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trade">Trade Category</Label>
                <Select value={trade} onValueChange={setTrade}>
                  <SelectTrigger id="trade">
                    <SelectValue placeholder="Select a trade category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., Boiler Installation"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Describe the work to be done..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes (not visible to customer)..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">
                  No items yet. Click "Add Item" to get started.
                </p>
              </div>
            ) : (
              lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/20"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, "description", e.target.value)
                      }
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Unit Price ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 text-right">
                    <span className="text-xs text-muted-foreground block">Total</span>
                    <span className="text-sm font-medium">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeTax"
                  checked={includeTax}
                  onCheckedChange={setIncludeTax}
                />
                <Label htmlFor="includeTax" className="cursor-pointer">
                  Apply Tax
                </Label>
              </div>
              {includeTax && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="taxRate" className="text-sm">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {includeTax && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({taxRate}%)
                  </span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
