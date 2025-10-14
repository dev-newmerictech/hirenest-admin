// Logout button component example

"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  className?: string;
}

export function LogoutButton({
  variant = "outline",
  size = "default",
  showIcon = true,
  className,
}: LogoutButtonProps) {
  const { logout, user } = useAuth();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={logout}
      className={className}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      Logout
    </Button>
  );
}

// Example usage in a header/navbar:
// import { LogoutButton } from "@/components/admin/logout-button";
//
// function Header() {
//   return (
//     <header>
//       <nav>
//         <LogoutButton />
//       </nav>
//     </header>
//   );
// }

