// Reusable search bar component

"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ placeholder = "Search...", value, onChange }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync with external value if it changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounce the change notification
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [localValue, onChange])

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 bg-white"
      />
    </div>
  )
}
