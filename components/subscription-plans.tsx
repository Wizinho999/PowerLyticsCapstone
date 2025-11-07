"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  athleteLimit: number
  price: number
  popular?: boolean
}

const plans: SubscriptionPlan[] = [
  {
    id: "inicial",
    name: "inicial",
    displayName: "Inicial",
    athleteLimit: 5,
    price: 9990,
  },
  {
    id: "basico",
    name: "basico",
    displayName: "Básico",
    athleteLimit: 15,
    price: 19990,
  },
  {
    id: "profesional",
    name: "profesional",
    displayName: "Profesional",
    athleteLimit: 30,
    price: 39990,
    popular: true,
  },
  {
    id: "avanzado",
    name: "avanzado",
    displayName: "Avanzado",
    athleteLimit: 50,
    price: 59990,
  },
  {
    id: "ilimitado",
    name: "ilimitado",
    displayName: "Ilimitado",
    athleteLimit: 999999,
    price: 99990,
  },
]

interface SubscriptionPlansProps {
  currentPlan?: string
  onSelectPlan: (planId: string) => void
}

export function SubscriptionPlans({ currentPlan, onSelectPlan }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId)
    try {
      await onSelectPlan(planId)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative flex flex-col ${
            plan.popular ? "border-primary shadow-lg" : ""
          } ${currentPlan === plan.name ? "border-green-500" : ""}`}
        >
          {plan.popular && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
              Más Popular
            </Badge>
          )}
          {currentPlan === plan.name && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">Plan Actual</Badge>
          )}
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold text-foreground">${plan.price.toLocaleString("es-CL")}</span>
              <span className="text-muted-foreground"> /mes</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-8">
            <p className="text-4xl font-bold text-foreground mb-2">
              {plan.athleteLimit === 999999 ? "∞" : plan.athleteLimit}
            </p>
            <p className="text-sm text-muted-foreground">
              {plan.athleteLimit === 999999 ? "Atletas ilimitados" : `Hasta ${plan.athleteLimit} atletas`}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={currentPlan === plan.name ? "outline" : "default"}
              disabled={currentPlan === plan.name || loading === plan.id}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {loading === plan.id ? "Procesando..." : currentPlan === plan.name ? "Plan Actual" : "Seleccionar Plan"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
