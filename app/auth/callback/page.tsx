import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage() {
  const supabase = await createClient()

  // Get the user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Get user role from metadata
    const userRole = user.user_metadata?.role || "athlete"

    // Redirect based on role
    if (userRole === "coach") {
      redirect("/coach")
    } else {
      redirect("/dashboard")
    }
  }

  // If no user, redirect to login
  redirect("/")
}
