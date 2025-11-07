"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { SubscriptionPlans } from "@/components/subscription-plans"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function SubscriptionPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [athleteCount, setAthleteCount] = useState(0)
  const [athleteLimit, setAthleteLimit] = useState(5)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Load current subscription
      const { data: subscription } = await supabase
        .from("coach_subscriptions")
        .select("*")
        .eq("coach_id", user.id)
        .single()

      if (subscription) {
        setCurrentPlan(subscription.plan_name)
        setAthleteLimit(subscription.athlete_limit)
      }

      // Load current athlete count
      const { count } = await supabase
        .from("coach_athletes")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", user.id)
        .eq("status", "accepted")

      setAthleteCount(count || 0)
    } catch (error) {
      console.error("[v0] Error loading subscription data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string, priceId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Create Stripe Checkout Session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          planId,
          userId: user.id,
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("[v0] Error creating checkout session:", error)
      alert("Error al procesar el pago. Por favor intenta de nuevo.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/coach")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Planes de Suscripción</h1>
          <p className="text-muted-foreground">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>
      </div>

      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Tu Plan Actual</CardTitle>
            <CardDescription>
              Estás usando {athleteCount} de {athleteLimit} atletas disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(athleteCount / athleteLimit) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <SubscriptionPlans currentPlan={currentPlan || undefined} onSelectPlan={handleSelectPlan} />
    </div>
  )
}
