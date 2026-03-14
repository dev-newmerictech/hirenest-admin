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
  isDocumentVerified?: boolean
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
  isDocumentVerified?: boolean
  createdAt: string
}

export interface JobPostAPIResponse {
  _id: string
  title: string
  description: string
  contactEmail: string
  contactPhone: {
    countryCode: number | null
    mobileNumber: number | null
  }
  hasCollectiveScreening: boolean
  address: {
    addressLine1: string
    country: string
    state: string
    city: string
    postalCode: string
    location: {
      latitude: number
      longitude: number
    }
  }
  company: string | {
    _id: string
    name: string
    email: string
  }
  preferences: {
    skills: string[]
    workMode: string[]
    employmentType: string[]
  }
  jobPostDeadLine: string
  jobViews: number
  jobApplied: number
  jobStatus: "open" | "closed"
  externalLink: string
  createdAt: string
  updatedAt: string
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
  salary?: string
  requirements?: string[]
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

// Subscription Plan Types
export interface SubscriptionPlanLimits {
  resumeBuilds?: number
  freeInterviews?: number
  linkedinRequiredAfter?: number
}

export interface SubscriptionPlan {
  _id: string
  name: string
  type: "seeker" | "provider"
  price: number
  billingCycle: "monthly" | "yearly" | "lifetime"
  credits: number
  features: string[]
  limits: SubscriptionPlanLimits
  isActive: boolean
  isDefault: boolean
  priority: number
  description?: string
  razorpayPlanId?: string
  createdAt: string
  updatedAt: string
}

export interface CreditCostConfig {
  _id: string
  actionType: string
  creditCost: number
  isActive: boolean
  description: string
  category: "interview" | "feature" | "boost"
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  _id: string
  userId: string
  profileId: string
  planId: string | SubscriptionPlan
  status: "active" | "expired" | "cancelled" | "trial" | "free"
  credits: {
    planCredits: number
    extraCredits: number
    usedCredits: number
  }
  billingCycle: {
    startDate: string
    endDate: string
  }
  linkedinUrl?: string
  customPlanOverride?: {
    credits?: number
    features?: string[]
    limits?: SubscriptionPlanLimits
  }
  createdAt: string
  updatedAt: string
}

export interface AssignPlanRequest {
  planId: string
  resetCredits?: boolean
  resetBillingCycle?: boolean
  reason?: string
}

export interface SubscriptionWithProfile extends Subscription {
  profile?: {
    name: string
    email: string
    type: string
  }
  plan?: SubscriptionPlan
}

export interface CreditTransaction {
  _id: string
  subscriptionId: string
  profileId: string
  transactionType: "debit" | "credit" | "refund" | "expired" | "addon" | "plan_reset"
  actionType: string
  creditsAmount: number
  balanceBefore: number
  balanceAfter: number
  description?: string
  createdAt: string
}

export interface SubscriptionAnalytics {
  overview: {
    totalSubscriptions: number
    activeSubscriptions: number
    seekerSubscriptions: number
    providerSubscriptions: number
    totalCreditsConsumed: number
  }
  planDistribution: Array<{
    planName: string
    planType: string
    count: number
  }>
  recentTransactions: CreditTransaction[]
}
