import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SubscriptionPendingPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-yellow-600">Pago Pendiente</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Tu pago está siendo procesado. Te notificaremos cuando se complete la transacción.
            </p>
            <Link href="/coach">
              <Button className="w-full bg-transparent" variant="outline">
                Volver al Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}
