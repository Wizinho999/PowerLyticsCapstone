"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calendar, FileText, Users, Trash2 } from "lucide-react"
import { CollapsibleInfoCard } from "@/components/collapsible-info-card"

interface Block {
  id: string
  name: string
  description: string | null
  total_days: number
  total_weeks: number
  status: string
  start_date: string | null
  end_date: string | null
  athlete_count: number
}

export function CoachBlocksList() {
  const router = useRouter()
  const supabase = createClient()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get blocks created by this coach
      const { data: blocksData, error: blocksError } = await supabase
        .from("training_blocks")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false })

      if (blocksError) throw blocksError

      // Get athlete count for each block
      const blocksWithCounts = await Promise.all(
        (blocksData || []).map(async (block) => {
          const { count } = await supabase
            .from("athlete_blocks")
            .select("*", { count: "exact", head: true })
            .eq("block_id", block.id)

          return {
            ...block,
            athlete_count: count || 0,
          }
        }),
      )

      setBlocks(blocksWithCounts)
    } catch (error) {
      console.error("[v0] Error loading blocks:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteBlock = async (blockId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este bloque? Esta acción no se puede deshacer y eliminará todos los días y ejercicios asociados.",
      )
    ) {
      return
    }

    try {
      const { error } = await supabase.from("training_blocks").delete().eq("id", blockId)

      if (error) throw error

      loadBlocks()
    } catch (error) {
      console.error("[v0] Error deleting block:", error)
      alert("Error al eliminar el bloque. Por favor intenta de nuevo.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando bloques...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CollapsibleInfoCard title="Bloques de Entrenamiento" storageKey="coach-blocks-info">
        <div className="space-y-1">
          <p>
            Los <span className="font-medium">bloques de entrenamiento</span> organizan tu programación en ciclos con
            objetivos específicos (fuerza, hipertrofia, potencia).
          </p>
          <p className="text-xs mt-2">
            <span className="font-medium">Tips:</span> Organiza por semanas, asigna a múltiples atletas, duplica bloques
            exitosos, y rastrea el progreso de cada atleta.
          </p>
        </div>
      </CollapsibleInfoCard>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Bloques de Entrenamiento</h2>
        <Button onClick={() => router.push("/coach/blocks/new")} className="bg-teal-500 hover:bg-teal-600">
          <Plus className="mr-2 h-4 w-4" />
          Crear Bloque
        </Button>
      </div>

      {blocks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="mb-4 text-muted-foreground">No has creado ningún bloque de entrenamiento</p>
          <Button onClick={() => router.push("/coach/blocks/new")} className="bg-teal-500 hover:bg-teal-600">
            Crear tu primer bloque
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {blocks.map((block) => (
            <Card
              key={block.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/coach/blocks/${block.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold flex-1">{block.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteBlock(block.id)
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 -mt-1 -mr-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {block.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{block.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-teal-500" />
                    <span>{block.total_days} días</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    <span>{block.total_weeks} semanas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-teal-500" />
                    <span>{block.athlete_count} atletas</span>
                  </div>
                </div>
                {(block.start_date || block.end_date) && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    {block.start_date && <span>Inicio: {new Date(block.start_date).toLocaleDateString()}</span>}
                    {block.start_date && block.end_date && <span className="mx-2">•</span>}
                    {block.end_date && <span>Fin: {new Date(block.end_date).toLocaleDateString()}</span>}
                  </div>
                )}
                <div className="mt-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      block.status === "active"
                        ? "bg-green-100 text-green-700"
                        : block.status === "completed"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {block.status === "active" ? "Activo" : block.status === "completed" ? "Completado" : "Borrador"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
