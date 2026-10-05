// Reusable drawer component for displaying and editing detailed information
// Slides in from the right and covers 50% of the screen width

"use client";

import type React from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  children,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[600px] sm:max-w-[620px] p-0 flex flex-col gap-0 h-full overflow-hidden"
      >
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-xl font-semibold truncate pr-8">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 w-full">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
