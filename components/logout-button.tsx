"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      // Get current user before signing out
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        console.log("Logging out user:", user.id)
      }

      // Sign out
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error signing out:", error)
      } else {
        console.log("Successfully signed out")
        // Redirect or handle successful logout
        window.location.href = "/login" // or use your router
      }
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      variant="outline"
      className="flex items-center space-x-2 bg-transparent"
    >
      <LogOut className="h-4 w-4" />
      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
    </Button>
  )
}
