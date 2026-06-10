import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/providers/trpc"
import { useState } from "react"
import { toast } from "sonner"
import { Link } from "react-router"

export default function AccountPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const utils = trpc.useUtils()

  const { data: subscription } = trpc.subscription.getStatus.useQuery(
    undefined,
    { enabled: !!user }
  )

  const [name, setName] = useState(user?.name || "")
  const [companyName, setCompanyName] = useState(user?.companyName || "")
  const [phone, setPhone] = useState(user?.phone || "")

  // Update profile mutation would go here when backend supports it
  const [isSaving, setIsSaving] = useState(false)

  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to open billing portal")
    },
  })

  const handleManageBilling = () => {
    const returnUrl = `${window.location.origin}/account`
    createPortal.mutate({ returnUrl })
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    // Profile update would be implemented here with a mutation
    toast.success("Profile saved (demo)")
    setIsSaving(false)
  }

  const statusColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    past_due: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Account Settings</h1>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.name || "Your Profile"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email || "Manage your personal information"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">
                    Current Plan: {(subscription?.tier || "free").charAt(0).toUpperCase() + (subscription?.tier || "free").slice(1)}
                  </p>
                  <Badge
                    variant="outline"
                    className={statusColors[subscription?.status || "free"] || ""}
                  >
                    {(subscription?.status || "free").replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription?.tier === "free" && "Limited to 5 quotes per month"}
                  {subscription?.tier === "starter" && "Unlimited quotes + premium features"}
                  {subscription?.tier === "pro" && "Everything + team collaboration"}
                  {subscription?.tier === "business" && "Enterprise features + API access"}
                </p>
              </div>
              <div className="flex gap-2">
                {subscription?.tier && subscription.tier !== "free" ? (
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={createPortal.isPending}
                  >
                    {createPortal.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Manage Billing
                  </Button>
                ) : (
                  <Link to="/pricing">
                    <Button>Upgrade</Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding Card */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <Input id="logo" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">
                Upload your logo to appear on quotes. Recommended: 200x50px PNG.
                <br />
                <span className="text-primary">
                  Premium feature - upgrade to Starter to enable.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Sign Out */}
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">
                  End your current session on this device.
                </p>
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete your account and all quotes. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure? This cannot be undone!")) {
                    toast.info("Account deletion would be processed here")
                  }
                }}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
