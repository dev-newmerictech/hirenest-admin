// Admin login page with seamless 2FA / TOTP authentication

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { loginAsync, login2FAAsync, clearError } from "@/lib/store/authSlice"
import { ShieldCheck, ArrowLeft, KeyRound } from "lucide-react"
import './login.css'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  
  // Redux state
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // 2FA state
  const [isMfaStep, setIsMfaStep] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [otpToken, setOtpToken] = useState("")

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/admin/dashboard")
    }
  }, [isAuthenticated, user, router])

  // Handle login errors
  useEffect(() => {
    if (error) {
      toast({
        title: isMfaStep ? "2FA Verification Failed" : "Login failed",
        description: error,
        variant: "destructive",
      })
      dispatch(clearError())
    }
  }, [error, toast, dispatch, isMfaStep])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const result = await dispatch(loginAsync({ email, password })).unwrap()
      
      // If account has 2FA enabled, transition to OTP challenge
      if (result.mfaRequired && result.tempToken) {
        setTempToken(result.tempToken)
        setIsMfaStep(true)
        toast({
          title: "Two-Factor Authentication",
          description: "Please enter the 6-digit code from your authenticator app.",
        })
        return
      }

      // Standard login success
      toast({
        title: "Login successful",
        description: `Welcome back, ${result.user?.firstName || 'Admin'}!`,
      })

      router.replace("/admin/dashboard")
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpToken || !tempToken) return

    try {
      const result = await dispatch(login2FAAsync({ tempToken, otpToken: otpToken.trim() })).unwrap()

      toast({
        title: "2FA Verified Successfully",
        description: `Welcome back, ${result.user?.firstName || 'Admin'}!`,
      })

      router.replace("/admin/dashboard")
    } catch (error) {
      console.error("2FA error:", error)
    }
  }

  return (
    <div className={'login-container'}>
      <div className="left">
        <div className="text-div">
          <h3>
            <span>Welcome to </span>HireNest AI
          </h3>
          <h1>
            Your Gateway to <br /> Career Success!
          </h1>
        </div>
      </div>
      <div className="right">
        {!isMfaStep ? (
          <form onSubmit={handleLogin} className="w-full">
            <h1 className={'animate-pulse'}>HireNest</h1>
            <h2 className={'mb-1'}>Admin Login</h2>
            <h5>Enter your credentials to access the admin panel</h5>

            <div className="mb-6 mt-3 animate-in slide-in-from-top-4 duration-500 w-100">
              <div className={'mb-2'}>
                <div className="d-flex flex-row align-items-center justify-between mb-2 animate-in fade-in duration-300">
                  <h3 className="!text-[14px] !mb-0 font-medium text-[#2A3F5E]">
                    Email Address
                  </h3>
                </div>

                <div className="d-flex flex-row gap-2 animate-in slide-in-from-bottom-4 duration-400 delay-100">
                  <div className="flex-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className={'mb-4'}>
                <div className="d-flex flex-row align-items-center justify-between mb-2 animate-in fade-in duration-300">
                  <h3 className="!text-[14px] !mb-0 font-medium text-[#2A3F5E]">
                    Password
                  </h3>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={'mb-2'}>
                <Button
                  type="submit"
                  disabled={!password || !email || isLoading}
                  className={'!h-[40px] loginButton !w-[100%]'}
                >
                  <div className="relative z-10 d-flex flex-row items-center gap-1">
                    {isLoading ? "Logging in..." : "Login"}
                  </div>
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="w-full animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold !mb-0">Two-Factor Authentication</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the 6-digit verification code from your authenticator app (Google Authenticator, Apple Keychain, 1Password) or an 8-character backup code.
            </p>

            <div className="mb-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Security Code
                </label>
                <div className="relative">
                  <Input
                    id="otp"
                    type="text"
                    maxLength={10}
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="123456 or Backup Code"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    className="text-center font-mono text-lg tracking-widest h-11"
                    required
                  />
                  <KeyRound className="h-4 w-4 absolute right-3 top-3.5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={!otpToken.trim() || isLoading}
                  className="w-full h-10 font-semibold"
                >
                  {isLoading ? "Verifying..." : "Verify & Sign In"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsMfaStep(false)
                    setOtpToken("")
                  }}
                  className="w-full h-9 text-xs text-muted-foreground gap-1.5 hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to login credentials</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
