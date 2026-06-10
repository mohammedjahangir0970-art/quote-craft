import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, Clock, Shield, Zap, Users, Star, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Social Proof Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4" />
          <strong>247 tradespeople</strong> sent quotes this week · Join them today
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-xs">
            Trusted by 2,000+ trade businesses across the UK
          </Badge>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Professional Quotes{" "}
            <span className="text-primary">in Minutes</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Create, send, and track professional quotes for your trade business.
            Win more jobs with polished, branded quotes that impress clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote/new">
              <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                <FileText className="mr-2 h-5 w-5" />
                Create a Free Quote
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-auto">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            No credit card required · Free forever plan available
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y bg-muted/30 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Supporting trade professionals across all categories
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
            {["Plumbing", "Electrical", "Carpentry", "Painting", "Roofing", "HVAC", "Landscaping", "Tiling"].map((trade) => (
              <span key={trade} className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                {trade}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Everything You Need to Win Jobs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From quote creation to payment collection, QuoteCraft handles it all so you can focus on the work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Professional Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create beautifully formatted quotes with your branding, line items, and terms. Export as PDF.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Track Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  See when clients view your quotes and track acceptance rates in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Save Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Reuse templates, duplicate quotes, and automate your workflow with smart defaults.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your data is safe with enterprise-grade security and automatic backups.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Apple Pay Enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Let your clients pay instantly with Apple Pay and all major card providers via Stripe.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Built for Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Designed specifically for UK trade businesses. VAT handling, trade categories, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to streamline your quoting?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of trade professionals who use QuoteCraft to win more jobs and save hours every week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/quote/new">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Try Without Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
