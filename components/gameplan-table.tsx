"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CollapsibleInfoCard } from "@/components/collapsible-info-card"

export type GamePlanTier = "worst" | "normal" | "best"
export type GamePlanAttempt = "attempt1" | "attempt2" | "attempt3"
export type GamePlanLift = "squat" | "bench" | "deadlift"

type GamePlanAttemptValues = Record<GamePlanAttempt, Record<GamePlanTier, number | null>>
export type GamePlanData = Record<GamePlanLift, GamePlanAttemptValues>

const tierMeta: Record<GamePlanTier, { label: string; description: string }> = {
  worst: { label: "Peor", description: "Conservador" },
  normal: { label: "Normal", description: "Plan base" },
  best: { label: "Mejor", description: "Ambicioso" },
}

const attemptLabels: Record<GamePlanAttempt, string> = {
  attempt1: "Intento 1",
  attempt2: "Intento 2",
  attempt3: "Intento 3",
}

const liftLabels: Record<GamePlanLift, { title: string; color: string }> = {
  squat: { title: "Sentadilla", color: "text-emerald-600" },
  bench: { title: "Press Banca", color: "text-sky-600" },
  deadlift: { title: "Peso Muerto", color: "text-orange-600" },
}

export function createEmptyGamePlan(): GamePlanData {
  const template: Record<GamePlanAttempt, Record<GamePlanTier, number | null>> = {
    attempt1: { worst: null, normal: null, best: null },
    attempt2: { worst: null, normal: null, best: null },
    attempt3: { worst: null, normal: null, best: null },
  }

  return {
    squat: JSON.parse(JSON.stringify(template)) as GamePlanData,
    bench: JSON.parse(JSON.stringify(template)) as GamePlanData,
    deadlift: JSON.parse(JSON.stringify(template)) as GamePlanData,
  }
}

interface GamePlanTableProps {
  data: GamePlanData
  editable?: boolean
  onChange?: (data: GamePlanData) => void
}

export function GamePlanTable({ data, editable = false, onChange }: GamePlanTableProps) {
  const handleChange = (lift: GamePlanLift, attempt: GamePlanAttempt, tier: GamePlanTier, value: string) => {
    if (!editable || !onChange) return

    const numericValue = value === "" ? null : Number.parseFloat(value)
    const next = JSON.parse(JSON.stringify(data)) as GamePlanData
    next[lift][attempt][tier] = Number.isNaN(numericValue as number) ? null : numericValue
    onChange(next)
  }

  const liftOrder = Object.keys(liftLabels) as GamePlanLift[]
  const attemptOrder = Object.keys(attemptLabels) as GamePlanAttempt[]
  const tierOrder = Object.keys(tierMeta) as GamePlanTier[]

  return (
    <div className="space-y-4 w-full">
      <CollapsibleInfoCard title="Estrategia de Game Plan" storageKey="gameplan-info">
        <p>
          En competencias de powerlifting tienes <span className="font-medium">3 intentos</span> por levantamiento.
          Planifica 3 escenarios:
        </p>
        <ul className="text-xs space-y-0.5 ml-4 list-disc">
          <li>
            <span className="font-medium">Peor:</span> Plan conservador si no te sientes bien
          </li>
          <li>
            <span className="font-medium">Normal:</span> Plan base esperado
          </li>
          <li>
            <span className="font-medium">Mejor:</span> Plan ambicioso si todo va perfecto
          </li>
        </ul>
      </CollapsibleInfoCard>

      <div className="grid gap-6 md:grid-cols-3 w-full">
        {liftOrder.map((liftKey) => {
          const lift = liftLabels[liftKey]
          return (
            <div key={liftKey} className="border border-border rounded-xl bg-white shadow-sm flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <p className={cn("text-lg font-semibold", lift.color)}>{lift.title}</p>
                <p className="text-xs text-muted-foreground">Intentos · Peor / Normal / Mejor</p>
              </div>

              <div className="flex-1 p-4 space-y-4">
                {attemptOrder.map((attemptKey) => (
                  <div key={attemptKey} className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{attemptLabels[attemptKey]}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {tierOrder.map((tierKey) => (
                        <div key={tierKey} className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {tierMeta[tierKey].label}
                          </p>
                          {editable ? (
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="kg"
                              value={data[liftKey][attemptKey][tierKey] ?? ""}
                              onChange={(event) => handleChange(liftKey, attemptKey, tierKey, event.target.value)}
                            />
                          ) : (
                            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground min-h-[40px] flex items-center">
                              {data[liftKey][attemptKey][tierKey] ?? "-"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
