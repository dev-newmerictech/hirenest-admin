"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { Calendar as CalendarIcon, Check } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface DateRangeFilterProps {
  date?: DateRange
  setDate: (date: DateRange | undefined) => void
}

const PRESETS = [
  {
    label: "All Time",
    getValue: () => undefined,
  },
  {
    label: "Today",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "Yesterday",
    getValue: () => ({
      from: subDays(new Date(), 1),
      to: subDays(new Date(), 1),
    }),
  },
  {
    label: "Last 7 Days",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "Last 30 Days",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: "This Month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last Month",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
]

export function DateRangeFilter({ date, setDate }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [customMode, setCustomMode] = React.useState<"single" | "range" | null>(null)
  const [activeField, setActiveField] = React.useState<"start" | "end">("start")

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-full sm:w-[260px] justify-start text-left font-normal bg-card",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to && date.from.getTime() !== date.to.getTime() ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Filter by date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row" align="start">
        <div className="flex sm:flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r min-w-[150px]">
          <div className="font-medium text-sm px-2 pb-2">Presets</div>
          <ScrollArea className="h-32 sm:h-auto sm:max-h-[300px]">
            <div className="flex flex-row sm:flex-col gap-1 flex-wrap">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="justify-start font-normal text-sm"
                  onClick={() => {
                    setDate(preset.getValue())
                    setCustomMode(null)
                    setIsOpen(false)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <div className="flex sm:flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r min-w-[150px]">
          <div className="font-medium text-sm px-2 pb-2">Custom</div>
          <ScrollArea className="h-32 sm:h-auto sm:max-h-[300px]">
            <div className="flex flex-row sm:flex-col gap-1 flex-wrap">
              <Button
                variant={customMode === "single" ? "secondary" : "ghost"}
                className="justify-start font-normal text-sm"
                onClick={() => {
                  setCustomMode("single")
                  setDate(undefined)
                }}
              >
                Single Date
              </Button>
              <Button
                variant={customMode === "range" ? "secondary" : "ghost"}
                className="justify-start font-normal text-sm"
                onClick={() => {
                  setCustomMode("range")
                  setActiveField("start")
                  setDate(undefined)
                }}
              >
                Date Range
              </Button>
            </div>
          </ScrollArea>
        </div>
        
        {customMode && (
          <div className="p-3 flex flex-col">
            {customMode === "range" && (
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  size="sm"
                  variant={activeField === "start" ? "default" : "outline"} 
                  onClick={() => setActiveField("start")}
                >
                  Start: {date?.from ? format(date.from, "PP") : "Select"}
                </Button>
                <Button 
                  size="sm"
                  variant={activeField === "end" ? "default" : "outline"} 
                  onClick={() => setActiveField("end")}
                >
                  End: {date?.to ? format(date.to, "PP") : "Select"}
                </Button>
              </div>
            )}
            
            <div className="border rounded-md">
              {customMode === "single" ? (
                <Calendar
                  mode="single"
                  selected={date?.from}
                  onSelect={(d) => {
                    setDate(d ? { from: d, to: d } : undefined)
                    setIsOpen(false)
                  }}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              ) : (
                <Calendar
                  mode="single"
                  selected={activeField === "start" ? date?.from : date?.to}
                  onSelect={(d) => {
                    if (!d) return
                    if (activeField === "start") {
                      setDate({ from: d, to: date?.to && d > date.to ? undefined : date?.to })
                      setActiveField("end")
                    } else {
                      setDate({ from: date?.from, to: d })
                      setIsOpen(false)
                    }
                  }}
                  disabled={(d) => {
                    if (d > new Date()) return true
                    if (activeField === "end" && date?.from && d < date.from) return true
                    return false
                  }}
                  initialFocus
                />
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
