// Redirect root to admin login

import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/admin/login")
}
