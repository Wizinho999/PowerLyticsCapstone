"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronUp, ChevronDown, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CollapsibleInfoCard } from "@/components/collapsible-info-card"

interface TracFormProps {
  onSave: (data: TracData) => void
  onCancel: () => void
}

export interface TracData {
  leg_soreness: number
  push_soreness: number
  pull_soreness: number
  sleep_nutrition: number
  perceived_recovery: number
  motivation: number
  technical_comfort: number
  recorded_date: string
}

export function TracForm({ onSave, onCancel }: TracFormProps) {
  const [legSoreness, setLegSoreness] = useState(0)
  const [pushSoreness, setPushSoreness] = useState(0)
  const [pullSoreness, setPullSoreness] = useState(0)
  const [sleepNutrition, setSleepNutrition] = useState(0)
  const [perceivedRecovery, setPerceivedRecovery] = useState(0)
  const [motivation, setMotivation] = useState(0)
  const [technicalComfort, setTechnicalComfort] = useState(0)
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split("T")[0])

  const increment = (value: number, setter: (v: number) => void) => {
    if (value < 10) setter(value + 1)
  }

  const decrement = (value: number, setter: (v: number) => void) => {
    if (value > 0) setter(value - 1)
  }

  const handleSubmit = () => {
    onSave({
      leg_soreness: legSoreness,
      push_soreness: pushSoreness,
      pull_soreness: pullSoreness,
      sleep_nutrition: sleepNutrition,
      perceived_recovery: perceivedRecovery,
      motivation: motivation,
      technical_comfort: technicalComfort,
      recorded_date: recordedDate,
    })
  }

  const MetricRow = ({
    label,
    value,
    onIncrement,
    onDecrement,
    tooltip,
  }: {
    label: string
    value: number
    onIncrement: () => void
    onDecrement: () => void
    tooltip?: string
  }) => (
    <div className="flex items-center justify-between py-0.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-1">
        <span className="text-sm font-normal text-gray-900">{label}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base font-normal text-gray-500 w-5 text-center">{value}</span>
        <div className="flex flex-col gap-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={onIncrement}
            type="button"
          >
            <ChevronUp className="h-3 w-3 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={onDecrement}
            type="button"
          >
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <TooltipProvider>
      <div className="w-full space-y-1 px-0">
        <div className="mx-2.5 my-2.5">
          <CollapsibleInfoCard title="¿Qué es TRAC?" storageKey="trac-form-info">
            <p>
              <span className="font-semibold">TRAC</span> mide tu estado de recuperación en escala 0-20. 20 =
              condiciones ideales para entrenar. Usa esto para ajustar intensidad del entrenamiento.
            </p>
          </CollapsibleInfoCard>
        </div>

        <Card className="bg-white rounded-2xl shadow-sm mx-2.5 py-2.5 my-2.5">
          <CardContent className="p-2">
            <MetricRow
              label="Leg Soreness:"
              value={legSoreness}
              onIncrement={() => increment(legSoreness, setLegSoreness)}
              onDecrement={() => decrement(legSoreness, setLegSoreness)}
              tooltip="Dolor muscular en piernas (cuádriceps, glúteos, isquiotibiales). 0 = sin dolor, 20 = dolor extremo"
            />
            <MetricRow
              label="Push Soreness:"
              value={pushSoreness}
              onIncrement={() => increment(pushSoreness, setPushSoreness)}
              onDecrement={() => decrement(pushSoreness, setPushSoreness)}
              tooltip="Dolor muscular en músculos de empuje (pecho, hombros, tríceps). Usado en bench press."
            />
            <MetricRow
              label="Pull Soreness:"
              value={pullSoreness}
              onIncrement={() => increment(pullSoreness, setPullSoreness)}
              onDecrement={() => decrement(pullSoreness, setPullSoreness)}
              tooltip="Dolor muscular en músculos de tirón (espalda, bíceps). Usado en deadlift."
            />
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-sm my-2.5 py-2.5 mx-2.5 px-0">
          <CardContent className="p-2">
            <MetricRow
              label="Sleep/Nutrition:"
              value={sleepNutrition}
              onIncrement={() => increment(sleepNutrition, setSleepNutrition)}
              onDecrement={() => decrement(sleepNutrition, setSleepNutrition)}
              tooltip="Calidad de sueño y alimentación. 0 = muy malo, 20 = óptimo (8+ horas de sueño, nutrición completa)"
            />
            <MetricRow
              label="Perceived Recovery:"
              value={perceivedRecovery}
              onIncrement={() => increment(perceivedRecovery, setPerceivedRecovery)}
              onDecrement={() => decrement(perceivedRecovery, setPerceivedRecovery)}
              tooltip="Qué tan recuperado te sientes en general. 0 = agotado, 20 = 100% recuperado y listo"
            />
          </CardContent>
        </Card>

        <div className="text-xs font-semibold text-gray-400 tracking-wide mx-2.5">AFTER A WORKOUT DAY</div>
        <Card className="bg-white rounded-2xl shadow-sm my-2.5 py-2.5 mx-2.5">
          <CardContent className="p-2">
            <MetricRow
              label="Motivation:"
              value={motivation}
              onIncrement={() => increment(motivation, setMotivation)}
              onDecrement={() => decrement(motivation, setMotivation)}
              tooltip="Tu nivel de motivación para entrenar. 0 = sin ganas, 20 = super motivado"
            />
            <MetricRow
              label="Technical Comfort:"
              value={technicalComfort}
              onIncrement={() => increment(technicalComfort, setTechnicalComfort)}
              onDecrement={() => decrement(technicalComfort, setTechnicalComfort)}
              tooltip="Confianza con tu técnica en los movimientos. 0 = inseguro, 20 = técnica perfecta"
            />
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-sm my-2.5 py-2.5 mx-2.5">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">Fecha</label>
              <input
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full mt-2 px-0 py-0 ml-0 mr-0"
        >
          Add Trac
        </Button>
      </div>
    </TooltipProvider>
  )
}
