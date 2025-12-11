import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[SERVER] Starting subscription creation...")

    const { planId, userId } = await request.json()
    console.log("[SERVER] Plan selected:", planId)
    console.log("[SERVER] User ID:", userId)

    if (!userId) {
      console.log("[SERVER] No user ID provided")
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Plan configuration
    const plans = {
      inicial: {
        name: "Plan Inicial",
        price: 9990,
        athleteLimit: 5,
        reason: "Suscripción Plan Inicial - Hasta 5 atletas",
      },
      basico: {
        name: "Plan Básico",
        price: 19990,
        athleteLimit: 15,
        reason: "Suscripción Plan Básico - Hasta 15 atletas",
      },
      profesional: {
        name: "Plan Profesional",
        price: 39990,
        athleteLimit: 30,
        reason: "Suscripción Plan Profesional - Hasta 30 atletas",
      },
      avanzado: {
        name: "Plan Avanzado",
        price: 59990,
        athleteLimit: 50,
        reason: "Suscripción Plan Avanzado - Hasta 50 atletas",
      },
      ilimitado: {
        name: "Plan Ilimitado",
        price: 99990,
        athleteLimit: 999999,
        reason: "Suscripción Plan Ilimitado - Atletas ilimitados",
      },
    }

    const selectedPlan = plans[planId as keyof typeof plans]
    if (!selectedPlan) {
      console.log("[v0] [SERVER] Invalid plan:", planId)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    console.log("[SERVER] Selected plan:", selectedPlan.name)

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!mpToken) {
      console.error("[SERVER] MERCADOPAGO_ACCESS_TOKEN not configured")
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 })
    }

    console.log("[SERVER] Mercado Pago token found")

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    console.log("[SERVER] Site URL:", siteUrl)

    const preference = {
      items: [
        {
          title: selectedPlan.name,
          quantity: 1,
          unit_price: selectedPlan.price,
          currency_id: "CLP",
        },
      ],
      back_urls: {
        success: `${siteUrl}/coach/subscription/success`,
        failure: `${siteUrl}/coach/subscription/failure`,
        pending: `${siteUrl}/coach/subscription/pending`,
      },
      external_reference: `${userId}-${planId}`,
      notification_url: `${siteUrl}/api/mercadopago-webhook`,
      statement_descriptor: "PowerLytics",
      metadata: {
        user_id: userId,
        plan_id: planId,
        athlete_limit: selectedPlan.athleteLimit,
      },
    }

    console.log("[SERVER] Creating Mercado Pago preference with back_urls:", preference.back_urls)

    // Call Mercado Pago API
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify(preference),
    })

    console.log("[SERVER] Mercado Pago response status:", response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error("[SERVER] Mercado Pago API error:", error)
      return NextResponse.json(
        {
          error: "Failed to create preference",
          details: error,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("[SERVER] Mercado Pago preference created:", data.id)

    return NextResponse.json({
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    })
  } catch (error) {
    console.error("[SERVER] Error creating subscription:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
