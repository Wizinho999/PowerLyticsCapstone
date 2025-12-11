"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Plus, FileText, MoreHorizontal } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@/lib/supabase/client"
import { LoadingLogo } from "@/components/loading-logo"

interface TrainingDay {
  id: string
  name: string
  day_number: number
  week_number: number
  exercise_count: number
}

interface Block {
  id: string
  name: string
  total_weeks: number
}

export default function BlockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [block, setBlock] = useState<Block | null>(null)
  const [days, setDays] = useState<TrainingDay[]>([])
  const [selectedWeek, setSelectedWeek] = useState("1")
  const [loading, setLoading] = useState(true)
  const [showCreateDayDialog, setShowCreateDayDialog] = useState(false)
  const [newDayName, setNewDayName] = useState("")
  const [creating, setCreating] = useState(false)

  const blockId = params.blockId as string

  useEffect(() => {
    loadBlockData()
  }, [blockId, selectedWeek])

  const loadBlockData = async () => {
    try {
      const { data: blockData, error: blockError } = await supabase
        .from("training_blocks")
        .select("*")
        .eq("id", blockId)
        .single()

      if (blockError) throw blockError
      setBlock(blockData)

      const { data: daysData, error: daysError } = await supabase
        .from("training_days")
        .select(`
          *,
          day_exercises (count)
        `)
        .eq("block_id", blockId)
        .eq("week_number", Number.parseInt(selectedWeek))
        .order("day_number")

      if (daysError) throw daysError

      const formattedDays =
        daysData?.map((day: any) => ({
          id: day.id,
          name: day.name,
          day_number: day.day_number,
          week_number: day.week_number,
          exercise_count: day.day_exercises?.[0]?.count || 0,
        })) || []

      setDays(formattedDays)
    } catch (error) {
      console.error("[v0] Error loading block data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createDay = async () => {
    if (!newDayName.trim()) return

    setCreating(true)
    try {
      const maxDayNumber = days.length > 0 ? Math.max(...days.map((d) => d.day_number)) : 0

      const { error } = await supabase.from("training_days").insert({
        block_id: blockId,
        name: newDayName,
        day_number: maxDayNumber + 1,
        week_number: Number.parseInt(selectedWeek),
      })

      if (error) throw error

      const { error: updateError } = await supabase
        .from("training_blocks")
        .update({ total_days: (block?.total_weeks || 0) * (days.length + 1) })
        .eq("id", blockId)

      if (updateError) throw updateError

      setNewDayName("")
      setShowCreateDayDialog(false)
      loadBlockData()
    } catch (error) {
      console.error("[v0] Error creating day:", error)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingLogo size="lg" />
      </div>
    )
  }

  if (!block) {
    return <div>Block not found</div>
  }

  const weeks = Array.from({ length: block.total_weeks }, (_, i) => ({
    id: i + 1,
    name: `Week ${i + 1}`,
  }))

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-teal-500">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-teal-500">
            Edit
          </Button>
          <Button variant="ghost" size="icon" className="text-teal-500" onClick={() => setShowCreateDayDialog(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Block title */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold text-foreground">{block.name}</h1>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-32 bg-white border-2 border-teal-500 text-teal-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week.id} value={week.id.toString()}>
                  {week.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Training days */}
      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Workouts</h3>
          <p className="text-muted-foreground mb-6">Press '+' to create a workout</p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <Card
              key={day.id}
              className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow py-1.5"
              onClick={() => router.push(`/blocks/${blockId}/day/${day.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{day.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-teal-500" />
                        <span>{day.exercise_count} Exercises</span>
                      </div>
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

      <Dialog open={showCreateDayDialog} onOpenChange={setShowCreateDayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Create a new workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Day 1"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createDay()}
              className="text-center"
            />
            <Button
              onClick={createDay}
              disabled={creating || !newDayName.trim()}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
            >
              {creating ? "Creando..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation currentPage="blocks" />
    </div>
  )
}
