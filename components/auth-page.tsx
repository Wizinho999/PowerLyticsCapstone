"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type AuthMode = "login" | "register"
type UserRole = "athlete" | "coach"

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [role, setRole] = useState<UserRole>("athlete")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccessMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (mode === "register") {
        console.log("Starting registration process...")
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              role: role,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) throw signUpError

        if (data.user) {
          console.log("Registration successful:", data.user.id)
          setSuccessMessage(
            "¡Registro exitoso! Por favor revisa tu email para verificar tu cuenta. Puedes cerrar esta ventana.",
          )
        }
      } else {
        console.log("Starting login process...")
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) throw signInError

        if (data.user) {
          console.log("Login successful:", data.user.id)
          const userRole = data.user.user_metadata?.role || "athlete"
          console.log("User role:", userRole)

          setSuccessMessage("¡Inicio de sesión exitoso! Redirigiendo...")

          await new Promise((resolve) => setTimeout(resolve, 500))

          const redirectPath = userRole === "coach" ? "/coach" : "/dashboard"
          console.log("Redirecting to:", redirectPath)
          window.location.href = redirectPath
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error)
      setError(error.message || "Error en la autenticación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="inline-block">
            <Image
              src="/images/powerlytics-logo.png"
              alt="PowerLytics"
              width={220}
              height={110}
              className="object-contain"
            />
          </div>
          <h1 className="font-bold text-foreground text-5xl tracking-tighter gap-0">PowerLytics</h1>
          <p className="text-muted-foreground">{mode === "login" ? "Bienvenido de vuelta" : "Únete a la comunidad"}</p>
        </div>
        <Card className="bg-card border-border shadow-lg">
          {mode === "register" && (
            <CardHeader className="space-y-4">
              {/* Role Selector - Only show in register mode */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Selecciona tu rol</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1 transition-all duration-200",
                      role === "athlete"
                        ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
                        : "hover:bg-muted",
                    )}
                    onClick={() => setRole("athlete")}
                  >
                    Atleta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1 transition-all duration-200",
                      role === "coach"
                        ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
                        : "hover:bg-muted",
                    )}
                    onClick={() => setRole("coach")}
                  >
                    Coach
                  </Button>
                </div>
              </div>
            </CardHeader>
          )}

          <CardContent className={mode === "login" ? "pt-6" : ""}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field - Only in register */}
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground">
                    Nombre de Usuario
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa tu nombre de usuario"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="bg-input border-border focus:ring-foreground focus:border-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingresa tu email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-input border-border focus:ring-foreground focus:border-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-input border-border focus:ring-foreground focus:border-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3 text-center">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3 text-center">
                  {successMessage}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
              >
                {isLoading ? "Cargando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
              </Button>

              {/* Forgot Password Link - Only show in login mode */}
              {mode === "login" && (
                <div className="text-center">
                  <Button type="button" variant="link" className="text-foreground hover:text-foreground/80 text-sm">
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <Button
              type="button"
              variant="link"
              className="text-foreground hover:text-foreground/80 p-0 h-auto font-medium"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Regístrate aquí" : "Inicia sesión"}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
