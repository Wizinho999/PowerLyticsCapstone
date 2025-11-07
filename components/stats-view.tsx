"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

const tabs = [
  { id: "exercises", label: "Ejercicios", active: true },
  { id: "weight", label: "Peso corporal", active: false },
  { id: "trac", label: "Trac", active: false },
]

const timeRanges = [
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "6M", label: "6M" },
]

// Mock data for the chart
const chartData = [
  { date: "18/8", value: 0 },
  { date: "25/8", value: 0 },
  { date: "1/9", value: 0 },
  { date: "8/9", value: 0 },
  { date: "15/9", value: 0 },
]

export function StatsView() {
  const [activeTab, setActiveTab] = useState("exercises")
  const [selectedTimeRange, setSelectedTimeRange] = useState("1M")
  const [selectedMetric, setSelectedMetric] = useState("E1RM")

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Estadísticas</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`
                flex-1 rounded-none border-b-2 bg-transparent
                ${
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-500 bg-transparent"
                    : "border-transparent text-muted-foreground"
                }
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <Button variant="outline" className="bg-white border-border text-foreground">
          Lista de ejercicios
        </Button>

        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="bg-white border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="E1RM">Métrica: E1RM</SelectItem>
            <SelectItem value="volume">Métrica: Volumen</SelectItem>
            <SelectItem value="intensity">Métrica: Intensidad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart Card */}
      <Card className="bg-white border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          {/* Time range selector */}
          <div className="flex justify-end mb-4">
            <div className="flex bg-muted rounded-lg p-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.id}
                  variant={selectedTimeRange === range.id ? "default" : "ghost"}
                  size="sm"
                  className={`
                    px-4 py-1 text-sm
                    ${
                      selectedTimeRange === range.id
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                  onClick={() => setSelectedTimeRange(range.id)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis
                  domain={[0, 400]}
                  ticks={[0, 100, 200, 300, 400]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Date range */}
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span>16 ago 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span>16 sept 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <BottomNavigation currentPage="stats" />
    </div>
  )
}
