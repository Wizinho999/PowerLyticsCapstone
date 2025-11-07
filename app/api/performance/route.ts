import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const athleteId = searchParams.get("athleteId")
  const exerciseId = searchParams.get("exerciseId")
  const period = searchParams.get("period") || "3months"

  if (!athleteId) {
    return NextResponse.json({ error: "Athlete ID is required" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date(now)

    switch (period) {
      case "1month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "3months":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "6months":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "1year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Get exercise logs with exercise details
    let query = supabase
      .from("exercise_logs")
      .select(`
        *,
        day_exercises!inner (
          exercise_id,
          exercises (
            id,
            name,
            category
          ),
          training_days!inner (
            week_number,
            day_number,
            scheduled_date,
            training_blocks!inner (
              id,
              name
            )
          )
        )
      `)
      .eq("athlete_id", athleteId)
      .gte("completed_at", startDate.toISOString())
      .order("completed_at", { ascending: true })

    if (exerciseId) {
      query = query.eq("day_exercises.exercise_id", exerciseId)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error("Error fetching performance data:", error)
      return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 })
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        e1rmData: [],
        tonnageData: [],
        stressData: [],
        nlData: [],
        blockSummaries: [],
        availableExercises: [],
      })
    }

    // Calculate e1RM for each log using Brzycki formula: weight * (36 / (37 - reps))
    const calculateE1RM = (weight: number, reps: number) => {
      if (reps === 1) return weight
      return weight * (36 / (37 - reps))
    }

    // Process data for 1RM progression
    const e1rmData = logs
      .filter((log: any) => log.day_exercises?.exercises && log.day_exercises?.training_days)
      .map((log: any) => ({
        date: new Date(log.completed_at).toLocaleDateString("es-CL", { month: "short", day: "numeric" }),
        e1rm: Math.round(calculateE1RM(Number.parseFloat(log.actual_weight), log.actual_reps)),
        exercise: log.day_exercises.exercises?.name || "Ejercicio desconocido",
        week: log.day_exercises.training_days?.week_number || 0,
        blockName: log.day_exercises.training_days?.training_blocks?.name || "Sin bloque",
      }))

    // Calculate tonnage by week
    const tonnageByWeek: Record<string, number> = {}
    logs.forEach((log: any) => {
      if (!log.day_exercises?.training_days?.week_number) return
      const week = `Sem ${log.day_exercises.training_days.week_number}`
      const tonnage = Number.parseFloat(log.actual_weight) * log.actual_reps
      tonnageByWeek[week] = (tonnageByWeek[week] || 0) + tonnage
    })

    const tonnageData = Object.entries(tonnageByWeek).map(([week, tonnage]) => ({
      week,
      tonnage: Math.round(tonnage),
    }))

    // Calculate Stress Index by week (based on RPE and volume)
    const stressByWeek: Record<string, { totalStress: number; count: number }> = {}
    logs.forEach((log: any) => {
      if (!log.day_exercises?.training_days?.week_number) return
      const week = `Sem ${log.day_exercises.training_days.week_number}`
      const rpe = Number.parseFloat(log.actual_rpe) || 7
      const sets = 1 // Each log is one set
      const reps = log.actual_reps
      // Stress = Sets × Reps × RPE / 10
      const stress = (sets * reps * rpe) / 10

      if (!stressByWeek[week]) {
        stressByWeek[week] = { totalStress: 0, count: 0 }
      }
      stressByWeek[week].totalStress += stress
      stressByWeek[week].count += 1
    })

    const stressData = Object.entries(stressByWeek).map(([week, data]) => ({
      week,
      stress: Math.round((data.totalStress / data.count) * 10) / 10,
    }))

    // Calculate Neural Load (NL) by exercise category
    const nlByExercise: Record<string, { totalNL: number; count: number }> = {}
    logs.forEach((log: any) => {
      if (!log.day_exercises?.exercises?.name) return
      const exercise = log.day_exercises.exercises.name
      const weight = Number.parseFloat(log.actual_weight)
      const reps = log.actual_reps
      const rpe = Number.parseFloat(log.actual_rpe) || 7

      // Neural Load formula: (weight × reps × RPE) / body_weight_estimate
      // Using 75kg as average estimate if body weight not available
      const nl = (weight * reps * rpe) / 75

      if (!nlByExercise[exercise]) {
        nlByExercise[exercise] = { totalNL: 0, count: 0 }
      }
      nlByExercise[exercise].totalNL += nl
      nlByExercise[exercise].count += 1
    })

    const nlData = Object.entries(nlByExercise).map(([exercise, data]) => ({
      exercise,
      nl: Math.round(data.totalNL / data.count),
    }))

    // Get block summaries
    const { data: blocks } = await supabase
      .from("athlete_blocks")
      .select(`
        *,
        training_blocks (
          name,
          description,
          start_date,
          end_date
        )
      `)
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })

    const blockSummaries =
      blocks?.map((block: any) => ({
        id: block.id,
        name: block.training_blocks?.name || "Sin nombre",
        period:
          block.training_blocks?.start_date && block.training_blocks?.end_date
            ? `${new Date(block.training_blocks.start_date).toLocaleDateString("es-CL", { month: "short", year: "numeric" })} - ${new Date(block.training_blocks.end_date).toLocaleDateString("es-CL", { month: "short", year: "numeric" })}`
            : "Periodo no definido",
        progress: block.training_blocks?.total_weeks
          ? Math.round((block.current_week / block.training_blocks.total_weeks) * 100)
          : 0,
        status: block.status === "active" ? "En progreso" : block.status === "completed" ? "Completado" : "Planificado",
      })) || []

    // Get available exercises for the athlete
    const { data: availableExercises } = await supabase
      .from("exercise_logs")
      .select(`
        day_exercises!inner (
          exercises (
            id,
            name
          )
        )
      `)
      .eq("athlete_id", athleteId)

    const uniqueExercises = Array.from(
      new Set(
        availableExercises
          ?.filter((log: any) => log.day_exercises?.exercises)
          .map((log: any) => JSON.stringify(log.day_exercises.exercises)),
      ),
    ).map((str) => JSON.parse(str as string))

    return NextResponse.json({
      e1rmData,
      tonnageData,
      stressData,
      nlData,
      blockSummaries,
      availableExercises: uniqueExercises,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
