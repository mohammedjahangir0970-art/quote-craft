import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Hammer, Zap, Users, Target } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About QuoteCraft</h1>
          <p className="text-xl text-muted-foreground">
            Built by tradespeople, for tradespeople
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-12">
          <p className="text-lg text-muted-foreground leading-relaxed">
            QuoteCraft was born from a simple observation: tradespeople spend too much time 
            on paperwork and not enough time doing what they do best. We set out to build 
            the easiest, most professional quote builder specifically designed for the trades 
            industry.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Hammer className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Built for the Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Designed specifically for builders, electricians, plumbers, and all trade 
                professionals who need to create quotes quickly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create professional quotes in under 2 minutes. No more wrestling with 
                Word documents or spreadsheets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Customer First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your quotes look professional and polished, helping you win more jobs 
                and impress clients.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Always Improving</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We continuously add new features based on feedback from our community of 
                trade professionals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
