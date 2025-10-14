// Admin login page

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { loginAsync, clearError } from "@/lib/store/authSlice"
import './login.css'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  
  // Redux state
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

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
        title: "Login failed",
        description: error,
        variant: "destructive",
      })
      dispatch(clearError())
    }
  }, [error, toast, dispatch])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Dispatch login action
      const result = await dispatch(loginAsync({ email, password })).unwrap()
      
      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${result.user.firstName}!`,
      })

      // Redirect to dashboard
      router.replace("/admin/dashboard")
    } catch (error) {
      // Error is handled by useEffect above
      console.error("Login error:", error)
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
                disabled={
                  !password ||
                  !email
                }
                className={'!h-[40px] loginButton !w-[100%]'}

              >
                <div className="relative z-10 d-flex flex-row items-center gap-1">
                  {isLoading ? "Logging in..." : "Login"}
                </div>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
