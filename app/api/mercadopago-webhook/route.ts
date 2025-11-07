import { NextResponse } from "next"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("[v0] Mercado Pago webhook received:", body)

    // Verify webhook authenticity (optional but recommended)
    // You can implement x-signature verification here

    // Handle payment notification
    if (body.type === "payment") {
      const paymentId = body.data.id

      // Fetch payment details from Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      })

      if (!response.ok) {
        console.error("[v0] Failed to fetch payment details")
        return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 })
      }

      const payment = await response.json()

      console.log("[v0] Payment details:", payment)

      // Only process approved payments
      if (payment.status === "approved") {
        const externalReference = payment.external_reference
        const [userId, planId] = externalReference.split("-")

        const supabase = await createClient()

        // Get plan details
        const plans = {
          inicial: { athleteLimit: 5 },
          basico: { athleteLimit: 15 },
          profesional: { athleteLimit: 30 },
          avanzado: { athleteLimit: 50 },
          ilimitado: { athleteLimit: 999999 },
        }

        const selectedPlan = plans[planId as keyof typeof plans]

        // Create or update subscription
        const { error } = await supabase.from("coach_subscriptions").upsert({
          coach_id: userId,
          plan_name: planId,
          athlete_limit: selectedPlan.athleteLimit,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          payment_provider: "mercadopago",
          payment_id: paymentId,
        })

        if (error) {
          console.error("[v0] Error updating subscription:", error)
          return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
        }

        console.log("[v0] Subscription activated for user:", userId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
