"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useState } from "react"

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

// Mock data for calendar activities
const calendarData = {
  5: { teal: true, purple: true },
  6: { purple: true },
  7: { teal: true },
  8: { purple: true },
  9: { teal: true },
  12: { teal: true },
  13: { purple: true },
  14: { teal: true },
  15: { purple: true },
  16: { teal: true, purple: true, selected: true },
  19: { teal: true },
  20: { purple: true },
  21: { teal: true },
  22: { teal: true },
  24: { purple: true },
  26: { teal: true },
  28: { teal: true },
  30: { teal: true },
  31: { purple: true },
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(4) // May = 4 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025)

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
            const dayData = calendarData[dayNumber as keyof typeof calendarData]

            return (
              <div key={index} className="aspect-square flex flex-col items-center justify-center relative">
                {isValidDay && (
                  <>
                    <div
                      className={`
                      w-full h-full flex items-center justify-center text-lg font-medium rounded-lg
                      ${dayData?.selected ? "bg-teal-500 text-white" : "text-foreground"}
                    `}
                    >
                      {dayNumber}
                    </div>
                    {dayData && (
                      <div className="absolute bottom-1 flex gap-1">
                        {dayData.teal && <div className="w-2 h-2 bg-teal-500 rounded-full"></div>}
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

      {/* Activity cards */}
      <div className="space-y-3">
        <Card className="bg-white border-0 shadow-sm py-1.5">
          <CardContent className="px-3 py-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">Entrenamiento</h3>
                  <div className="text-teal-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground">SBD (B)</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Semana: 4</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-teal-500 rounded"></div>
                    <span>BLOQUE 2</span>
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

        <Card className="bg-white border-0 shadow-sm py-1.5">
          <CardContent className="px-3 py-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">Trac</h3>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-purple-500 font-medium">Empuje:</span>
                    <span className="text-muted-foreground">5/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-purple-500 font-medium">Tracción:</span>
                    <span className="text-muted-foreground">5/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-purple-500 font-medium">Pierna:</span>
                    <span className="text-muted-foreground">5/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <span className="text-muted-foreground">16/20</span>
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
      </div>

      <BottomNavigation currentPage="calendar" />
    </div>
  )
}
