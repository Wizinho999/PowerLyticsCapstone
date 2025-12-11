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

    if (type === "summary") {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const prevMonthStart = new Date(startOfMonth)
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)

      const toISODate = (date: Date) => date.toISOString().split("T")[0]

      const [monthPaidRes, prevMonthPaidRes, totalPaidRes, pendingRes] = await Promise.all([
        supabase
          .from("billing")
          .select("amount")
          .eq("coach_id", coachId)
          .eq("status", "paid")
          .gte("paid_date", toISODate(startOfMonth)),
        supabase
          .from("billing")
          .select("amount")
          .eq("coach_id", coachId)
          .eq("status", "paid")
          .gte("paid_date", toISODate(prevMonthStart))
          .lt("paid_date", toISODate(startOfMonth)),
        supabase.from("billing").select("amount").eq("coach_id", coachId).eq("status", "paid"),
        supabase
          .from("billing")
          .select("amount")
          .eq("coach_id", coachId)
          .in("status", ["pending", "overdue"]),
      ])

      const sumAmounts = (data?: { amount: number }[] | null) =>
        data?.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0) || 0

      const monthIncome = sumAmounts(monthPaidRes.data)
      const prevMonthIncome = sumAmounts(prevMonthPaidRes.data)
      const totalIncome = sumAmounts(totalPaidRes.data)
      const pendingAmount = sumAmounts(pendingRes.data)

      const incomeDiff =
        prevMonthIncome > 0 ? ((monthIncome - prevMonthIncome) / prevMonthIncome) * 100 : monthIncome > 0 ? 100 : 0

      return NextResponse.json({
        summary: {
          totalIncome,
          monthIncome,
          prevMonthIncome,
          incomeDiff,
          pendingAmount,
        },
      })
    }

    if (type === "athletes") {
      const { data, error } = await supabase
        .from("athletes")
        .select(`
          id,
          profiles(
            full_name,
            email
          )
        `)
        .eq("coach_id", coachId)

      if (error) {
        console.error("Error fetching athletes:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const athletes = (data || []).map((athlete: any) => {
        const profile = athlete.profiles || {}
        const fullName = profile.full_name || profile.email || "Sin nombre"
        return {
          id: athlete.id,
          full_name: fullName,
        }
      })

      return NextResponse.json({ athletes })
    }

    const { data, error } = await supabase
      .from("billing")
      .select(`
        *,
        athletes!inner(
          id,
          profiles(
            full_name,
            email
          )
        )
      `)
      .eq("coach_id", coachId)
      .order("due_date", { ascending: false })

    if (error) {
      console.error("Error fetching billing:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const billingRecords = (data || []).map((record: any) => {
      const profile = record.athletes?.profiles || {}
      const athleteName = profile.full_name || profile.email || "Sin nombre"

      return {
        id: record.id,
        athlete_id: record.athlete_id,
        athlete_name: athleteName,
        due_date: record.due_date,
        amount: record.amount,
        payment_method: record.payment_method || "monthly",
        paid_date: record.paid_date,
        amount_due: record.status === "paid" ? 0 : record.amount,
        status: record.status,
        notes: record.notes,
      }
    })

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
