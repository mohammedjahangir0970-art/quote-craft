import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Link, useNavigate } from "react-router"
import { FileText, TrendingUp, Eye, CheckCircle, Clock, XCircle, Loader2, Plus, Copy, Trash2 } from "lucide-react"
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useState } from "react"

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const utils = trpc.useUtils()

  const { data: quotes, isLoading: quotesLoading } = trpc.quote.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )

  const { data: stats } = trpc.quote.stats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )

  const deleteQuote = trpc.quote.delete.useMutation({
    onSuccess: () => {
      toast.success("Quote deleted")
      utils.quote.list.invalidate()
      utils.quote.stats.invalidate()
    },
  })

  const duplicateQuote = trpc.quote.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Quote duplicated")
      utils.quote.list.invalidate()
      utils.quote.stats.invalidate()
    },
  })

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this quote?")) return
    setDeletingId(id)
    await deleteQuote.mutateAsync({ id })
    setDeletingId(null)
  }

  const handleDuplicate = async (id: number) => {
    setDuplicatingId(id)
    await duplicateQuote.mutateAsync({ id })
    setDuplicatingId(null)
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      expired: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    }
    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-16">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your dashboard</h2>
          <p className="text-muted-foreground mb-6">
            Create and manage your professional quotes
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
            <Link to="/quote/new">
              <Button variant="outline">Create a Quote</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your quotes and track performance
          </p>
        </div>
        <Link to="/quote/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQuotes ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSent ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalApproved ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.winRate ?? 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Your Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {quotesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : quotes && quotes.length > 0 ? (
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {quote.quoteNumber}
                      </span>
                      {statusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {quote.customerName}
                      {quote.trade && ` · ${quote.trade}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ${Number(quote.total).toFixed(2)}
                      {quote.viewCount && quote.viewCount > 0
                        ? ` · Viewed ${quote.viewCount} time${quote.viewCount !== 1 ? "s" : ""}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(quote.id)}
                      disabled={duplicatingId === quote.id}
                    >
                      {duplicatingId === quote.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Link to={`/quote/${quote.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quote.id)}
                      disabled={deletingId === quote.id}
                    >
                      {deletingId === quote.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                No quotes yet. Create your first quote to get started!
              </p>
              <Link to="/quote/new">
                <Button variant="outline">Create Your First Quote</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
