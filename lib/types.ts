// Type definitions for the admin panel

export interface User {
  id: string
  email: string
  role: "admin" | "job_seeker" | "company"
  createdAt: string
}

export interface JobSeeker {
  id: string
  name: string
  email: string
  phone: string
  registrationDate: string
  isActive: boolean
}

// API Response format from backend
export interface JobSeekerAPIResponse {
  _id: string
  name: string
  email: string
  mobile: {
    countryCode: number
    mobileNumber: number
  }
  isActive: boolean
  createdAt: string
}

export interface Company {
  id: string
  name: string
  email: string
  industry: string
  registrationDate: string
  isActive: boolean
  isVerified: boolean
  verificationStatus: "pending" | "approved" | "rejected"
}

// API Response format from backend for companies
export interface CompanyAPIResponse {
  _id: string
  name: string
  email: string
  industry?: string
  mobile: {
    countryCode: number | null
    mobileNumber: number | null
  }
  isActive: boolean
  isVerified?: boolean
  verificationStatus?: "pending" | "approved" | "rejected"
  createdAt: string
}

export interface Job {
  id: string
  title: string
  companyId: string
  companyName: string
  description: string
  postedDate: string
  status: "active" | "closed"
  location: string
  type: "full-time" | "part-time" | "contract" | "internship"
}

export interface Application {
  id: string
  jobId: string
  jobSeekerId: string
  appliedDate: string
  status: "pending" | "reviewed" | "accepted" | "rejected"
}

export interface DashboardStats {
  totalUsers: number
  totalJobSeekers: number
  totalCompanies: number
  activeJobs: number
  totalApplications: number
}

export interface PlatformSettings {
  platformName: string
  platformEmail: string
  defaultJobExpiryDays: number
  requireEmailVerification: boolean
}

export interface Feature {
  id: string
  name: string
  description: string
  category: "core" | "advanced" | "premium" | "enterprise"
  createdAt: string
}

export interface Package {
  id: string
  name: string
  description: string
  price: number
  billingCycle: "monthly" | "yearly" | "lifetime"
  isActive: boolean
  features: string[] // Array of feature IDs
  maxJobPostings: number
  maxApplications: number
  priority: number // Display order
  createdAt: string
  updatedAt: string
}

export interface PackageWithFeatures extends Package {
  featureDetails: Feature[]
}
