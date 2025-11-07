import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get("coachId")
    const type = searchParams.get("type")

    if (!coachId) {
      return NextResponse.json({ error: "Coach ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    if (type === "athletes") {
      const { data, error } = await supabase
        .from("athletes")
        .select(`
          id,
          profiles!inner(
            full_name
          )
        `)
        .eq("coach_id", coachId)

      if (error) {
        console.error("Error fetching athletes:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const athletes = (data || []).map((athlete: any) => ({
        id: athlete.id,
        name: athlete.profiles?.full_name || "Sin nombre",
      }))

      return NextResponse.json({ athletes })
    }

    const { data, error } = await supabase
      .from("billing")
      .select(`
        *,
        athletes!inner(
          id,
          profiles!inner(
            full_name
          )
        )
      `)
      .eq("coach_id", coachId)
      .order("due_date", { ascending: false })

    if (error) {
      console.error("Error fetching billing:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const billingRecords = (data || []).map((record: any) => ({
      id: record.id,
      athlete_id: record.athlete_id,
      athlete_name: record.athletes?.profiles?.full_name || "Sin nombre",
      due_date: record.due_date,
      amount: record.amount,
      payment_method: record.payment_method || "monthly",
      paid_date: record.paid_date,
      amount_due: record.status === "paid" ? 0 : record.amount,
      status: record.status,
      notes: record.notes,
    }))

    return NextResponse.json({ billingRecords })
  } catch (error) {
    console.error("Error in athlete-billing GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { coachId, athleteId, dueDate, amount, paymentMethod, notes } = body

    if (!coachId || !athleteId || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("billing")
      .insert({
        coach_id: coachId,
        athlete_id: athleteId,
        due_date: dueDate,
        amount: Number.parseFloat(amount),
        payment_method: paymentMethod || "transfer",
        status: "pending",
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating billing:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ billing: data })
  } catch (error) {
    console.error("Error in athlete-billing POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, dueDate, amount, paymentMethod, notes } = body

    if (!id) {
      return NextResponse.json({ error: "Billing ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const updates: any = {}
    if (dueDate) updates.due_date = dueDate
    if (amount) updates.amount = Number.parseFloat(amount)
    if (paymentMethod) updates.payment_method = paymentMethod
    if (notes !== undefined) updates.notes = notes

    const { data, error } = await supabase.from("billing").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating billing:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ billing: data })
  } catch (error) {
    console.error("Error in athlete-billing PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: "Billing ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const updates: any = { status }
    if (status === "paid") {
      updates.paid_date = new Date().toISOString().split("T")[0]
    }

    const { data, error } = await supabase.from("billing").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating billing status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ billing: data })
  } catch (error) {
    console.error("Error in athlete-billing PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
