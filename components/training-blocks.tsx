"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Download, Plus, Calendar, FileText } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { TrainingBlockSkeleton } from "@/components/training-block-skeleton"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import useSWR from "swr"

interface TrainingBlock {
  id: string
  name: string
  total_days: number
  total_weeks: number
  status: string
}

export function TrainingBlocks() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newBlockName, setNewBlockName] = useState("")
  const [creating, setCreating] = useState(false)

  const {
    data: blocks,
    error,
    isLoading,
    mutate,
  } = useSWR<TrainingBlock[]>(
    "athlete-blocks",
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from("athlete_blocks")
        .select(`
          id,
          block:training_blocks (
            id,
            name,
            total_days,
            total_weeks,
            status
          )
        `)
        .eq("athlete_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (
        data
          ?.filter((item: any) => item.block !== null)
          .map((item: any) => ({
            id: item.block.id,
            name: item.block.name,
            total_days: item.block.total_days,
            total_weeks: item.block.total_weeks,
            status: item.block.status,
          })) || []
      )
    },
    {
      revalidateOnMount: true,
      dedupingInterval: 2000,
    },
  )

  const createBlock = async () => {
    if (!newBlockName.trim()) return

    setCreating(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: athleteData, error: athleteCheckError } = await supabase
        .from("athletes")
        .select("id")
        .eq("id", user.id)
        .single()

      if (athleteCheckError || !athleteData) {
        const { error: athleteCreateError } = await supabase.from("athletes").insert({ id: user.id }).select().single()

        if (athleteCreateError) {
          console.error("[v0] Error creating athlete record:", athleteCreateError)
          throw athleteCreateError
        }
      }

      const { data: blockData, error: blockError } = await supabase
        .from("training_blocks")
        .insert({
          athlete_id: user.id,
          name: newBlockName,
          total_weeks: 1,
          total_days: 0,
          status: "draft",
        })
        .select()
        .single()

      if (blockError) {
        console.error("[v0] Error creating block:", blockError)
        throw blockError
      }

      const { error: assignError } = await supabase.from("athlete_blocks").insert({
        athlete_id: user.id,
        block_id: blockData.id,
        status: "in_progress",
      })

      if (assignError) {
        console.error("[v0] Error assigning block:", assignError)
        throw assignError
      }

      setNewBlockName("")
      setShowCreateDialog(false)
      mutate()
    } catch (error) {
      console.error("[v0] Error creating block:", error)
      alert("Error al crear el bloque. Por favor intenta de nuevo.")
    } finally {
      setCreating(false)
    }
  }

  const deleteBlock = async (blockId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este bloque? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const { error } = await supabase.from("training_blocks").delete().eq("id", blockId)

      if (error) throw error

      mutate()
    } catch (error) {
      console.error("[v0] Error deleting block:", error)
      alert("Error al eliminar el bloque. Por favor intenta de nuevo.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Blocks</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-teal-500">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-teal-500">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <TrainingBlockSkeleton />
          <TrainingBlockSkeleton />
          <TrainingBlockSkeleton />
        </div>
        <BottomNavigation currentPage="blocks" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-destructive">Error al cargar bloques</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Blocks</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-teal-500">
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-teal-500" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Training blocks list */}
      <div className="space-y-3">
        {!blocks || blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No tienes bloques de entrenamiento</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-teal-500 hover:bg-teal-600">
              Crear tu primer bloque
            </Button>
          </div>
        ) : (
          blocks.map((block) => (
            <Card
              key={block.id}
              className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow py-1.5"
              onClick={() => router.push(`/blocks/${block.id}`)}
            >
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1.5">{block.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-teal-500" />
                        <span>{block.total_days} Días</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-teal-500" />
                        <span>
                          {block.total_weeks} {block.total_weeks === 1 ? "Semana" : "Semanas"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="text-teal-500 h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-foreground">Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">Copiar</DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground">Compartir</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBlock(block.id)
                        }}
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Create a new block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="New Block 9"
              value={newBlockName}
              onChange={(e) => setNewBlockName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createBlock()}
              className="text-center"
            />
            <Button
              onClick={createBlock}
              disabled={creating || !newBlockName.trim()}
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
