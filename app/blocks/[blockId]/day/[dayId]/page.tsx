"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Plus, MoreHorizontal } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@/lib/supabase/client"

interface DayExercise {
  id: string
  exercise_name: string
  target_sets: number
  actual_sets: number
  order_index: number
}

interface Day {
  id: string
  name: string
}

export default function DayDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createBrowserClient()

  const blockId = params.blockId as string
  const dayId = params.dayId as string

  const [day, setDay] = useState<Day | null>(null)
  const [exercises, setExercises] = useState<DayExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDayData()
  }, [dayId])

  const loadDayData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: dayData, error: dayError } = await supabase
        .from("training_days")
        .select("*")
        .eq("id", dayId)
        .single()

      if (dayError) throw dayError
      setDay(dayData)

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("day_exercises")
        .select(`
          *,
          exercise:exercises (name)
        `)
        .eq("training_day_id", dayId)
        .order("order_index")

      if (exercisesError) throw exercisesError

      console.log("[v0] Raw exercises data:", exercisesData)

      const formattedExercises = await Promise.all(
        (exercisesData || [])
          .filter((ex: any) => ex.exercise !== null)
          .map(async (ex: any) => {
            const { count } = await supabase
              .from("exercise_sets")
              .select("*", { count: "exact", head: true })
              .eq("day_exercise_id", ex.id)

            return {
              id: ex.id,
              exercise_name: ex.exercise.name,
              target_sets: ex.target_sets,
              actual_sets: count || 0,
              order_index: ex.order_index,
            }
          }),
      )

      console.log("[v0] Formatted exercises:", formattedExercises)
      setExercises(formattedExercises)
    } catch (error) {
      console.error("[v0] Error loading day data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!day) {
    return <div>Day not found</div>
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-teal-500">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-teal-500 font-medium">Atrás</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-teal-500">
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-teal-500"
            onClick={() => router.push(`/blocks/${blockId}/day/${dayId}/add-exercise`)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Day title */}
      <h1 className="text-3xl font-bold text-foreground mb-8">{day.name}</h1>

      {/* Exercises list */}
      {exercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No hay ejercicios en este día</p>
          <Button
            onClick={() => router.push(`/blocks/${blockId}/day/${dayId}/add-exercise`)}
            className="bg-teal-500 hover:bg-teal-600"
          >
            Agregar ejercicio
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow py-0"
              onClick={() => router.push(`/blocks/${blockId}/day/${dayId}/exercise/${exercise.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{exercise.exercise_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <svg className="h-4 w-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      <span>{exercise.actual_sets} Sets</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="text-teal-500">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Copy</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BottomNavigation currentPage="blocks" />
    </div>
  )
}
