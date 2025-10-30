"use client"

import { useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Check, MoreVertical, Trash2 } from "lucide-react"

type Role = "Licensed Seat (Full Access)" | "Hiring Manager (Limited)" | "Viewer"

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  isYou?: boolean
}

export default function SettingsPage() {
  const [inviteEmail, setInviteEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailTouched, setEmailTouched] = useState(false)
  const [role, setRole] = useState<Role>("Licensed Seat (Full Access)")
  const [team, setTeam] = useState<TeamMember[]>([
    {
      id: "you",
      name: "Admin (You)",
      email: typeof window !== "undefined" ? (JSON.parse(localStorage.getItem("user") || "{}")?.email || "-") : "-",
      role: "Licensed Seat (Full Access)",
      isYou: true,
    },
  ])
  const [pending, setPending] = useState<{ email: string; role: Role }[]>([])
  const [query, setQuery] = useState("")

  const filteredTeam = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return team
    return team.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
  }, [query, team])

  type TeamRow = TeamMember
  const teamColumns: Column<TeamRow>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (m) => (
        <Select
          value={m.role}
          onValueChange={(v) =>
            setTeam((prev) => prev.map((tm) => (tm.id === m.id ? { ...tm, role: v as Role } : tm)))
          }
        >
          <SelectTrigger className="bg-white min-w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Licensed Seat (Full Access)">Licensed Seat (Full Access)</SelectItem>
            <SelectItem value="Hiring Manager (Limited)">Hiring Manager (Limited)</SelectItem>
            <SelectItem value="Viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (m) => (
        <div className="flex justify-start">
          <Trash2 className="ml-4 h-4 w-4" />
        </div>
      ),
    },
  ]

  interface PendingRow { id: string; email: string; role: Role }
  const pendingRows: PendingRow[] = pending.map((p, i) => ({ id: `p-${i}`, email: p.email, role: p.role }))
  const pendingColumns: Column<PendingRow>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <Select
          value={row.role}
          onValueChange={(v) =>
            setPending((prev) => prev.map((r, idx) => `p-${idx}` === row.id ? { ...r, role: v as Role } : r))
          }
        >
          <SelectTrigger className="bg-white min-w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Licensed Seat (Full Access)">Licensed Seat (Full Access)</SelectItem>
            <SelectItem value="Hiring Manager (Limited)">Hiring Manager (Limited)</SelectItem>
            <SelectItem value="Viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex justify-start">
          <Trash2 className="ml-4 h-4 w-4" />
        </div>
      ),
    },
  ]

  const isValidEmail = (val: string) => {
    const value = val.trim()
    if (!value) return "Email is required"
    // Basic RFC 5322 compliant-enough email regex for UI validation
    const re = /^(?:[a-zA-Z0-9_'^&\-\+])+(?:\.(?:[a-zA-Z0-9_'^&\-\+])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
    if (!re.test(value)) return "Enter a valid email address"
    // Duplicate checks against current team and pending invites
    const inTeam = team.some((m) => m.email.toLowerCase() === value.toLowerCase())
    if (inTeam) return "Email already belongs to a team member"
    const inPending = pending.some((p) => p.email.toLowerCase() === value.toLowerCase())
    if (inPending) return "An invitation has already been sent to this email"
    return null
  }

  const sendInvite = () => {
    const err = isValidEmail(inviteEmail)
    setEmailTouched(true)
    setEmailError(err)
    if (err) return
    setPending((p) => [{ email: inviteEmail.trim(), role }, ...p])
    setInviteEmail("")
    setEmailTouched(false)
    setEmailError(null)
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6 mt-4 sm:mt-0">
          <PageHeader title="Invite Team Members" description="Add new team members by sending them an email invitation." />

          {/* Invite form */}
          <Card className="p-6 shadow-none  max-w-4xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                placeholder="jane@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  const v = e.target.value
                  setInviteEmail(v)
                  if (emailTouched) setEmailError(isValidEmail(v))
                }}
                onBlur={() => {
                  setEmailTouched(true)
                  setEmailError(isValidEmail(inviteEmail))
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "invite-email-error" : undefined}
                className="lg:flex-1"
              />
              {emailError && (
                <div id="invite-email-error" className="text-sm text-destructive lg:ml-0">
                  {emailError}
                </div>
              )}
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full lg:w-[280px] bg-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Licensed Seat (Full Access)">Licensed Seat (Full Access)</SelectItem>
                  <SelectItem value="Hiring Manager (Limited)">Hiring Manager (Limited)</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={sendInvite} disabled={!!isValidEmail(inviteEmail)} className="w-full lg:w-auto">Send Invite</Button>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="team" className="w-full  max-w-4xl">
            <TabsList>
              <TabsTrigger value="team">Your Team</TabsTrigger>
              <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="mt-4">
              <DataTable columns={teamColumns} data={filteredTeam} emptyMessage="No team members" />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <DataTable columns={pendingColumns} data={pendingRows} emptyMessage="No pending invitations" />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
