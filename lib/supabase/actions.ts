"use server"

import { createClient } from "@/lib/supabase/server"

interface SetUpdate {
  id: string
  reps: number
  weight: number | null
  rpe: number | null
}

export async function updateExerciseSets(sets: SetUpdate[]) {
  const supabase = await createClient()

  // Call the PostgreSQL function we created
  const { error } = await supabase.rpc("update_exercise_sets_bulk", {
    sets_data: sets,
  })

  if (error) {
    console.error("[v0] Error calling update_exercise_sets_bulk:", error)
    throw error
  }

  return { success: true }
}
