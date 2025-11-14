"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Zap, CheckCircle2, Calendar, MapPin, Dumbbell } from 'lucide-react'

export function CompetitionPlanning() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Planificar Competiciones</h2>
        <p className="text-muted-foreground">Gestiona competiciones y game plans para tus atletas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-2">Próximas Competiciones</p>
                <p className="text-4xl font-bold text-blue-900">2</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">Atletas Compitiendo</p>
                <p className="text-4xl font-bold text-green-900">4</p>
              </div>
              <div className="bg-green-200 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-2">Game Plans Listos</p>
                <p className="text-4xl font-bold text-orange-900">2</p>
              </div>
              <div className="bg-orange-200 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-2">Completadas</p>
                <p className="text-4xl font-bold text-purple-900">1</p>
              </div>
              <div className="bg-purple-200 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg mx-2 my-0 py-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Competiciones Próximas</CardTitle>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 py-0 my-3.5">Nueva Competición</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="p-5 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-lg text-foreground">Campeonato Regional 2024</h4>
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  15 de Diciembre, 2024
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  Centro Deportivo Municipal
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Dumbbell className="w-4 h-4 mr-2 text-blue-600" />
                  Powerlifting
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-2 text-blue-600" />
                  3 atletas
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Ver Detalles</Button>
                <Button size="sm" variant="ghost">Editar</Button>
              </div>
            </div>

            <div className="p-5 border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-transparent rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-lg text-foreground">Copa Nacional</h4>
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2 text-green-600" />
                  20 de Febrero, 2025
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 text-green-600" />
                  Estadio Nacional
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Dumbbell className="w-4 h-4 mr-2 text-green-600" />
                  Powerlifting
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  1 atleta
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Ver Detalles</Button>
                <Button size="sm" variant="ghost">Editar</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg py-2 my-0">
          <CardTitle className="text-white">Atletas en Competición</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-foreground">María González</h4>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Confirmada</div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Categoría:</span>
                  <span className="font-semibold">63kg Femenino</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total PR:</span>
                  <span className="font-bold text-blue-600 text-lg">395kg</span>
                </div>
              </div>
              <Button size="sm" className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Game Plan</Button>
            </div>

            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-foreground">Carlos Ruiz</h4>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Confirmado</div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Categoría:</span>
                  <span className="font-semibold">83kg Masculino</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total PR:</span>
                  <span className="font-bold text-green-600 text-lg">530kg</span>
                </div>
              </div>
              <Button size="sm" className="w-full mt-4 bg-green-600 hover:bg-green-700">Game Plan</Button>
            </div>

            <div className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-foreground">Ana López</h4>
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Pendiente</div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Categoría:</span>
                  <span className="font-semibold">57kg Femenino</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total PR:</span>
                  <span className="font-bold text-yellow-600 text-lg">335kg</span>
                </div>
              </div>
              <Button size="sm" className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700">Game Plan</Button>
            </div>

            <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-foreground">Diego Martín</h4>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Confirmado</div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Categoría:</span>
                  <span className="font-semibold">74kg Masculino</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total PR:</span>
                  <span className="font-bold text-orange-600 text-lg">470kg</span>
                </div>
              </div>
              <Button size="sm" className="w-full mt-4 bg-orange-600 hover:bg-orange-700">Game Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
