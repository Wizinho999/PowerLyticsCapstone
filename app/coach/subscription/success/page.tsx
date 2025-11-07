import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-green-600">¡Pago Exitoso!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todos los beneficios de tu plan.
            </p>
            <Link href="/coach">
              <Button className="w-full">Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}
