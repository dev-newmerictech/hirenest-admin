// Reusable drawer component for displaying and editing detailed information
// Slides in from the right and covers 50% of the screen width

"use client"

import type React from "react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}

export function DetailDrawer({ open, onOpenChange, title, children }: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-screen max-w-none sm:w-[50vw] sm:max-w-[50vw] p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="px-6 py-4">{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
