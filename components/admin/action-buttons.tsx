// Reusable action buttons component

"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Eye, Ban, CheckCircle, Trash2, User } from "lucide-react"

interface ActionButtonsProps {
  onView?: () => void
  onViewProfile?: () => void
  onActivate?: () => void
  onDeactivate?: () => void
  onDelete?: () => void
  isActive?: boolean
}

export function ActionButtons({ onView, onViewProfile, onActivate, onDeactivate, onDelete, isActive }: ActionButtonsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}
        {onViewProfile && (
          <DropdownMenuItem onClick={onViewProfile}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </DropdownMenuItem>
        )}
        {isActive !== undefined && (
          <>
            {isActive
              ? onDeactivate && (
                  <DropdownMenuItem onClick={onDeactivate}>
                    <Ban className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                )
              : onActivate && (
                  <DropdownMenuItem onClick={onActivate}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
          </>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
