import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { trpc } from "@/providers/trpc"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useState } from "react"

const plans = [
  {
    name: "Free",
    tier: "free" as const,
    price: "\u00a30",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "Up to 5 quotes per month",
      "Basic templates",
      "Email delivery",
      "Quote tracking",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    tier: "starter" as const,
    price: "\u00a319",
    period: "/month",
    description: "For growing trade businesses",
    features: [
      "Unlimited quotes",
      "Premium templates",
      "Email & PDF delivery",
      "Advanced analytics",
      "Custom branding",
      "Apple Pay support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    tier: "pro" as const,
    price: "\u00a349",
    period: "/month",
    description: "For established businesses",
    features: [
      "Everything in Starter",
      "Team collaboration",
      "API access",
      "Priority support",
      "Advanced integrations",
      "Apple Pay support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error("Checkout URL not available")
        setSelectedTier(null)
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout")
      setSelectedTier(null)
    },
  })

  const handleSubscribe = (tier: string) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to subscribe")
      navigate("/login")
      return
    }

    if (tier === "free") {
      navigate("/dashboard")
      return
    }

    setSelectedTier(tier)
    const successUrl = `${window.location.origin}/dashboard?subscribed=true`
    const cancelUrl = `${window.location.origin}/pricing?canceled=true`

    createCheckout.mutate({
      tier: tier as "starter" | "pro" | "business",
      billing: "monthly",
      successUrl,
      cancelUrl,
    })
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. All paid plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-primary shadow-lg md:scale-105" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={selectedTier === plan.tier && createCheckout.isPending}
                >
                  {selectedTier === plan.tier && createCheckout.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All prices exclude VAT where applicable. Cancel anytime from your account page.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Apple Pay and all major cards accepted securely via Stripe.
          </p>
        </div>
      </div>
    </div>
  )
}
