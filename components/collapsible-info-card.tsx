"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, X, ChevronDown, ChevronUp } from "lucide-react"

interface CollapsibleInfoCardProps {
  title: string
  storageKey: string
  children: React.ReactNode
  variant?: "default" | "compact"
}

export function CollapsibleInfoCard({ title, storageKey, children, variant = "default" }: CollapsibleInfoCardProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey)
    if (dismissed === "true") {
      setIsVisible(false)
    }
  }, [storageKey])

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <CardTitle className="text-sm font-semibold text-blue-900">{title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100 -mt-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="text-sm text-blue-800 space-y-2">{children}</div>
        </CardContent>
      )}
    </Card>
  )
}
