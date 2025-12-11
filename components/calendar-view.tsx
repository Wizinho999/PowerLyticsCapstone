"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LoadingLogo } from "@/components/loading-logo"

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

type CalendarDayData = {
  teal?: boolean // Has completed workouts
  yellow?: boolean // Has notes
  purple?: boolean // Has TRACs
  selected?: boolean
  workouts?: Array<{
    id: string
    name: string
    week: number
    blockName: string
    blockColor: string
  }>
  notes?: Array<{
    id: string
    content: string
    createdAt: string
  }>
  tracs?: Array<{
    id: string
    push_soreness: number
    pull_soreness: number
    leg_soreness: number
    total_score: number
    scheduled_date: string
  }>
}

type CalendarData = {
  [day: number]: CalendarDayData
}

export function CalendarView() {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()) // Current month (0-11)
  const [currentYear, setCurrentYear] = useState(now.getFullYear()) // Current year
  const [calendarData, setCalendarData] = useState<CalendarData>({})
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadCalendarData()
  }, [currentMonth, currentYear])

  const loadCalendarData = async () => {
    setLoading(true)
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const monthStart = new Date(currentYear, currentMonth, 1)
      const monthEnd = new Date(currentYear, currentMonth + 1, 0)

      // Format as YYYY-MM-DD for Supabase queries
      const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
      const monthEndStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`

      const [workoutsResult, notesResult, tracsResult] = await Promise.all([
        // Load scheduled workouts
        supabase
          .from("training_days")
          .select(`
            id,
            name,
            week_number,
            scheduled_date,
            training_blocks!inner (
              id,
              name,
              athlete_blocks!inner (
                athlete_id
              )
            )
          `)
          .eq("training_blocks.athlete_blocks.athlete_id", user.id)
          .gte("scheduled_date", monthStartStr)
          .lte("scheduled_date", monthEndStr)
          .not("scheduled_date", "is", null),

        // Load scheduled notes
        supabase
          .from("notes")
          .select("id, content, created_at, scheduled_date")
          .eq("author_id", user.id)
          .gte("scheduled_date", monthStartStr)
          .lte("scheduled_date", monthEndStr)
          .not("scheduled_date", "is", null),

        supabase
          .from("trac_logs")
          .select("id, leg_soreness, push_soreness, pull_soreness, sleep_nutrition, perceived_recovery, scheduled_date")
          .eq("user_id", user.id)
          .gte("scheduled_date", monthStartStr)
          .lte("scheduled_date", monthEndStr)
          .not("scheduled_date", "is", null),
      ])

      if (workoutsResult.error) {
        console.error("Error loading workouts:", workoutsResult.error)
      }

      if (notesResult.error) {
        console.error("Error loading notes:", notesResult.error)
      }

      if (tracsResult.error) {
        console.error("Error loading tracs:", tracsResult.error)
      }

      // Process data into calendar structure
      const newCalendarData: CalendarData = {}

      workoutsResult.data?.forEach((day: any) => {
        if (!day.scheduled_date) return

        const dateParts = day.scheduled_date.split("-")
        const dateYear = Number.parseInt(dateParts[0], 10)
        const dateMonth = Number.parseInt(dateParts[1], 10) - 1 // 0-indexed
        const dayNumber = Number.parseInt(dateParts[2], 10)

        // Skip if date doesn't match current calendar month/year
        if (dateYear !== currentYear || dateMonth !== currentMonth) return

        const block = day.training_blocks

        if (!newCalendarData[dayNumber]) {
          newCalendarData[dayNumber] = {
            teal: true,
            workouts: [],
            notes: [],
          }
        } else {
          newCalendarData[dayNumber].teal = true
          if (!newCalendarData[dayNumber].workouts) {
            newCalendarData[dayNumber].workouts = []
          }
        }

        newCalendarData[dayNumber].workouts?.push({
          id: day.id,
          name: day.name,
          week: day.week_number,
          blockName: block.name,
          blockColor: "teal",
        })
      })

      notesResult.data?.forEach((note: any) => {
        if (!note.scheduled_date) return

        const dateParts = note.scheduled_date.split("-")
        const dateYear = Number.parseInt(dateParts[0], 10)
        const dateMonth = Number.parseInt(dateParts[1], 10) - 1 // 0-indexed
        const dayNumber = Number.parseInt(dateParts[2], 10)

        // Skip if date doesn't match current calendar month/year
        if (dateYear !== currentYear || dateMonth !== currentMonth) return

        if (!newCalendarData[dayNumber]) {
          newCalendarData[dayNumber] = {
            yellow: true,
            workouts: [],
            notes: [],
          }
        } else {
          newCalendarData[dayNumber].yellow = true
          if (!newCalendarData[dayNumber].notes) {
            newCalendarData[dayNumber].notes = []
          }
        }

        newCalendarData[dayNumber].notes?.push({
          id: note.id,
          content: note.content,
          createdAt: note.created_at,
        })
      })

      tracsResult.data?.forEach((trac: any) => {
        if (!trac.scheduled_date) return

        const dateParts = trac.scheduled_date.split("-")
        const dateYear = Number.parseInt(dateParts[0], 10)
        const dateMonth = Number.parseInt(dateParts[1], 10) - 1 // 0-indexed
        const dayNumber = Number.parseInt(dateParts[2], 10)

        // Skip if date doesn't match current calendar month/year
        if (dateYear !== currentYear || dateMonth !== currentMonth) return

        const totalScore = trac.leg_soreness + trac.push_soreness + trac.pull_soreness

        if (!newCalendarData[dayNumber]) {
          newCalendarData[dayNumber] = {
            purple: true,
            workouts: [],
            notes: [],
            tracs: [],
          }
        } else {
          newCalendarData[dayNumber].purple = true
          if (!newCalendarData[dayNumber].tracs) {
            newCalendarData[dayNumber].tracs = []
          }
        }

        newCalendarData[dayNumber].tracs?.push({
          id: trac.id,
          push_soreness: trac.push_soreness,
          pull_soreness: trac.pull_soreness,
          leg_soreness: trac.leg_soreness,
          total_score: totalScore,
          scheduled_date: trac.scheduled_date,
        })
      })

      setCalendarData(newCalendarData)
    } catch (error) {
      console.error("Error loading calendar:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
  const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedDay(null)

    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const handleDayClick = (dayNumber: number) => {
    setSelectedDay(dayNumber)
  }

  const selectedDayData = selectedDay ? calendarData[selectedDay] : null

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
          <svg className="h-6 w-6 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </Button>

        <div className="text-center">
          <div className="text-lg text-muted-foreground">{currentYear}</div>
          <div className="text-3xl font-bold text-foreground">{months[currentMonth]}</div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
            <svg
              className="h-6 w-6 text-teal-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </Button>
          <Button variant="ghost" size="icon">
            <svg
              className="h-5 w-5 text-teal-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mb-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: totalCells }, (_, index) => {
            const dayNumber = index - firstDay + 1
            const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth
            const dayData = calendarData[dayNumber]
            const isSelected = dayNumber === selectedDay

            return (
              <div key={index} className="aspect-square flex flex-col items-center justify-center relative">
                {isValidDay && (
                  <>
                    <button
                      onClick={() => dayData && handleDayClick(dayNumber)}
                      disabled={!dayData}
                      className={`
                      w-full h-full flex items-center justify-center text-lg font-medium rounded-lg
                      transition-colors
                      ${isSelected ? "bg-teal-500 text-white" : "text-foreground hover:bg-muted"}
                      ${dayData ? "cursor-pointer" : "cursor-default"}
                    `}
                    >
                      {dayNumber}
                    </button>
                    {dayData && (
                      <div className="absolute bottom-1 flex gap-1">
                        {dayData.teal && <div className="w-2 h-2 bg-teal-700 rounded-full"></div>}
                        {dayData.yellow && <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>}
                        {dayData.purple && <div className="w-2 h-2 bg-purple-500 rounded-full"></div>}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDayData && (
        <div className="space-y-3">
          {/* Workouts */}
          {selectedDayData.workouts &&
            selectedDayData.workouts.length > 0 &&
            selectedDayData.workouts.map((workout) => (
              <Card key={workout.id} className="bg-white border-0 shadow-sm py-1.5">
                <CardContent className="px-3 py-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">Entrenamiento</h3>
                        <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">{workout.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Semana: {workout.week}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-teal-500 rounded"></div>
                          <span>{workout.blockName}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <svg
                        className="h-3 w-3 text-teal-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

          {/* Notes */}
          {selectedDayData.notes &&
            selectedDayData.notes.length > 0 &&
            selectedDayData.notes.map((note) => (
              <Card key={note.id} className="bg-white border-0 shadow-sm py-1.5">
                <CardContent className="px-3 py-0 my-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">Nota</h3>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground whitespace-pre-line my-0 mx-2 border-0">
                          {note.content}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>
                            {new Date(note.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <svg
                        className="h-3 w-3 text-yellow-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

          {selectedDayData.tracs &&
            selectedDayData.tracs.length > 0 &&
            selectedDayData.tracs.map((trac) => (
              <Card key={trac.id} className="bg-white border-0 shadow-sm py-1.5">
                <CardContent className="px-3 py-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">Trac</h3>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-purple-600">
                        <span className="px-0">Push: {trac.push_soreness}/5</span>
                        <span className="px-3">Pull: {trac.pull_soreness}/5</span>
                        <span>Legs: {trac.leg_soreness}/5</span>
                        <div className="flex items-center gap-1 ml-auto px-0 mr-9">
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span className="mx-0">{trac.total_score}/20</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <svg
                        className="h-3 w-3 text-purple-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {!selectedDay && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Selecciona un día para ver los detalles</p>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingLogo size="md" />
        </div>
      )}

      <BottomNavigation currentPage="calendar" />
    </div>
  )
}
