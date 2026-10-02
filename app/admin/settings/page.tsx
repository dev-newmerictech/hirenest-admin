"use client"

import { useMemo, useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/admin/auth-guard"
import { PageHeader } from "@/components/admin/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/admin/data-table"
import { Trash2, ShieldCheck, ShieldAlert, KeyRound, Copy, Check, RefreshCw, Lock, AlertCircle } from "lucide-react"
import { authApi, TwoFactorSetupResponse } from "@/lib/api/auth"
import { useToast } from "@/hooks/use-toast"

type Role = "Licensed Seat (Full Access)" | "Hiring Manager (Limited)" | "Viewer"

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  isYou?: boolean
}

export default function SettingsPage() {
  const { toast } = useToast()
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

  // ----------------------------------------------------------------------------
  // 2FA / SECURITY STATE
  // ----------------------------------------------------------------------------
  const [is2FALoading, setIs2FALoading] = useState(true)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [otpVerifyCode, setOtpVerifyCode] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [disableOtp, setDisableOtp] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch initial 2FA status
  const fetch2FAStatus = async () => {
    setIs2FALoading(true)
    try {
      const res = await authApi.get2FAStatus()
      setIs2FAEnabled(res.mfaEnabled)
    } catch (err) {
      console.error("Failed to load 2FA status:", err)
    } finally {
      setIs2FALoading(false)
    }
  }

  useEffect(() => {
    fetch2FAStatus()
  }, [])

  // Start 2FA setup (generate QR code & secret)
  const handleStartSetup = async () => {
    setActionLoading(true)
    try {
      const data = await authApi.setup2FA()
      setSetupData(data)
      setIsSettingUp(true)
      setOtpVerifyCode("")
    } catch (err: any) {
      toast({
        title: "Setup Failed",
        description: err.message || "Failed to initiate 2FA setup",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Confirm and activate 2FA
  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpVerifyCode.trim()) return

    setActionLoading(true)
    try {
      const res = await authApi.verifyAndEnable2FA(otpVerifyCode.trim())
      setIs2FAEnabled(true)
      setIsSettingUp(false)
      setSetupData(null)
      setBackupCodes(res.backupCodes || [])
      toast({
        title: "2FA Successfully Activated",
        description: "Your administrator account is now protected with Two-Factor Authentication.",
      })
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.message || "Invalid 6-digit code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Deactivate 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disablePassword) return

    setActionLoading(true)
    try {
      await authApi.disable2FA(disablePassword, disableOtp.trim() || undefined)
      setIs2FAEnabled(false)
      setIsDisabling(false)
      setDisablePassword("")
      setDisableOtp("")
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been removed from your account.",
      })
    } catch (err: any) {
      toast({
        title: "Deactivation Failed",
        description: err.message || "Incorrect password or OTP code.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: "key" | "codes") => {
    navigator.clipboard.writeText(text)
    if (type === "key") {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    }
    toast({ title: "Copied to clipboard" })
  }

  // ----------------------------------------------------------------------------
  // TEAM & INVITES (EXISTING FUNCTIONALITY)
  // ----------------------------------------------------------------------------
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

  const isValidEmail = (v: string) => {
    const trimmed = v.trim()
    if (!trimmed) return "Email is required"
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    return ok ? null : "Please enter a valid email address"
  }

  const sendInvite = () => {
    const err = isValidEmail(inviteEmail)
    if (err) {
      setEmailError(err)
      setEmailTouched(true)
      return
    }
    setPending((prev) => [...prev, { email: inviteEmail.trim(), role }])
    setInviteEmail("")
    setEmailTouched(false)
    setEmailError(null)
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6 mt-4 sm:mt-0">
          <PageHeader
            title="Admin Settings & Security"
            description="Manage team member access, configure Multi-Factor Authentication (2FA), and inspect session security."
          />

          {/* Tabs Container */}
          <Tabs defaultValue="team" className="w-full max-w-4xl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="team">Your Team</TabsTrigger>
              <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Security & 2FA</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: TEAM */}
            <TabsContent value="team" className="mt-4 space-y-6">
              <Card className="p-6 shadow-none">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Candidate interview policy</h3>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                    <li>MCQ/open-ended interviews can be resumed within 1 hour; timer resumes with saved answers and uploads.</li>
                    <li>Enforce a minimum <strong>10 Mbps</strong> connection check before starting collective or separate interviews.</li>
                    <li>Realtime video interviews restart fresh on reconnect or window close.</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6 shadow-none">
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

              <DataTable columns={teamColumns} data={filteredTeam} emptyMessage="No team members" />
            </TabsContent>

            {/* TAB 2: PENDING INVITATIONS */}
            <TabsContent value="pending" className="mt-4">
              <DataTable columns={pendingColumns} data={pendingRows} emptyMessage="No pending invitations" />
            </TabsContent>

            {/* TAB 3: SECURITY & 2FA */}
            <TabsContent value="security" className="mt-4 space-y-6">
              {/* 2FA Status Banner */}
              <Card className="p-6 shadow-sm border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {is2FAEnabled ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>2FA Active</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>2FA Not Configured</span>
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-foreground !mb-0">
                        Two-Factor Authentication (TOTP)
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      Two-factor authentication adds an essential second layer of protection to your HireNest Admin account. When enabled, signing in requires a 6-digit verification code from your authenticator app (Google Authenticator, Apple Keychain, 1Password) in addition to your password.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {is2FAEnabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDisabling(!isDisabling)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        {isDisabling ? "Cancel" : "Disable 2FA"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleStartSetup}
                        disabled={actionLoading || isSettingUp}
                        className="gap-1.5"
                      >
                        <KeyRound className="h-4 w-4" />
                        <span>Enable 2FA</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2FA Enrollment Wizard */}
                {isSettingUp && setupData && (
                  <div className="mt-6 pt-6 border-t border-border animate-in fade-in-50 duration-300 space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                      <h4 className="font-semibold text-foreground">Scan QR Code into your Authenticator App</h4>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-muted/40 p-5 rounded-xl border border-border">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={setupData.qrCodeUrl}
                          alt="2FA QR Code"
                          className="w-44 h-44 object-contain"
                        />
                      </div>

                      <div className="space-y-3 flex-1">
                        <p className="text-xs text-muted-foreground">
                          Open your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, or Apple Keychain) and scan this QR code.
                        </p>

                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Or enter secret key manually:
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="px-3 py-1.5 rounded bg-background border border-border text-xs font-mono font-bold tracking-wider select-all">
                              {setupData.secret}
                            </code>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(setupData.secret, "key")}
                              className="h-8 gap-1 text-xs"
                            >
                              {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedKey ? "Copied" : "Copy"}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                      <h4 className="font-semibold text-foreground">Verify 6-Digit Code</h4>
                    </div>

                    <form onSubmit={handleConfirm2FA} className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Enter the 6-digit code shown in your app:
                        </label>
                        <Input
                          id="verify-otp"
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={otpVerifyCode}
                          onChange={(e) => setOtpVerifyCode(e.target.value)}
                          className="font-mono text-center text-lg tracking-widest h-10 w-full sm:w-48"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          type="submit"
                          disabled={otpVerifyCode.length !== 6 || actionLoading}
                          className="gap-1.5"
                        >
                          {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          <span>Confirm & Activate</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsSettingUp(false)
                            setSetupData(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Emergency Backup Codes Display */}
                {backupCodes.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          Emergency Backup Codes
                        </h4>
                        <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                          Save these single-use codes in a secure password manager. If you ever lose your phone, you can sign in with one of these codes.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(backupCodes.join("\n"), "codes")}
                        className="gap-1.5 text-xs border-emerald-300 dark:border-emerald-700"
                      >
                        {copiedCodes ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCodes ? "Codes Copied" : "Copy All Codes"}</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-sm font-bold tracking-wider text-center">
                      {backupCodes.map((code, idx) => (
                        <div key={idx} className="bg-background px-3 py-2 rounded border border-border shadow-xs">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disable 2FA Form */}
                {isDisabling && is2FAEnabled && (
                  <form onSubmit={handleDisable2FA} className="mt-6 pt-6 border-t border-border space-y-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <h4 className="font-semibold text-sm">Confirm 2FA Deactivation</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Disabling two-factor authentication lowers your account security. Please verify your current password to proceed.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Current Password</label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Optional OTP Code</label>
                        <Input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={disableOtp}
                          onChange={(e) => setDisableOtp(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={!disablePassword || actionLoading}
                      >
                        {actionLoading ? "Disabling..." : "Confirm & Turn Off 2FA"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDisabling(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </Card>

              {/* Session & Architecture Security Profile */}
              <Card className="p-6 shadow-sm border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-foreground text-sm">Active Session Security Architecture</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground pt-1">
                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
                    <span className="font-semibold text-foreground block">15-Minute Access Tokens</span>
                    <p>JWT tokens are short-lived (15m) and securely stored in HttpOnly, Secure, SameSite cookies protected against XSS.</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
                    <span className="font-semibold text-foreground block">Rotating Refresh Tokens</span>
                    <p>Rotated automatically in the background every 15 minutes. Single-use hash storage prevents replay attacks.</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1">
                    <span className="font-semibold text-foreground block">Instant Server Revocation</span>
                    <p>Clicking Logout immediately deletes active refresh sessions in MongoDB and clears all browser credentials.</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
