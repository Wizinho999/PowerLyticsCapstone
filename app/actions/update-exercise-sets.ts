"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateExerciseSets(
  updates: Array<{
    id: string
    target_reps?: number | null
    target_weight?: number | null
    target_rpe?: number | null
  }>,
) {
  const supabase = await createClient()

  try {
    // Convert updates to the format expected by the SQL function
    const setsData = updates.map((update) => ({
      id: update.id,
      reps: update.target_reps,
      weight: update.target_weight,
      rpe: update.target_rpe,
    }))

    // Call the PostgreSQL function with all updates at once
    const { error } = await supabase.rpc("update_exercise_sets_bulk", {
      sets_data: setsData,
    })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Server action error:", error)
    return { success: false, error: error.message }
  }
}
