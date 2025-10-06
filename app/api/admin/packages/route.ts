import { NextResponse } from "next/server"
import type { Package, Feature, PackageWithFeatures } from "@/lib/types"

// Mock data
const mockFeatures: Feature[] = [
  {
    id: "1",
    name: "Basic Job Posting",
    description: "Post job listings on the platform",
    category: "core",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Application Management",
    description: "Manage and track job applications",
    category: "core",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Advanced Analytics",
    description: "Detailed insights and analytics dashboard",
    category: "advanced",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Priority Support",
    description: "24/7 priority customer support",
    category: "premium",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Custom Branding",
    description: "Customize job postings with your brand",
    category: "premium",
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "API Access",
    description: "Full API access for integrations",
    category: "enterprise",
    createdAt: new Date().toISOString(),
  },
]

const mockPackages: Package[] = [
  {
    id: "1",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    billingCycle: "monthly",
    isActive: true,
    features: ["1", "2"],
    maxJobPostings: 5,
    maxApplications: 50,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Professional",
    description: "For growing businesses",
    price: 49,
    billingCycle: "monthly",
    isActive: true,
    features: ["1", "2", "3", "5"],
    maxJobPostings: 50,
    maxApplications: 500,
    priority: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Enterprise",
    description: "For large organizations",
    price: 199,
    billingCycle: "monthly",
    isActive: true,
    features: ["1", "2", "3", "4", "5", "6"],
    maxJobPostings: -1, // Unlimited
    maxApplications: -1, // Unlimited
    priority: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Combine packages with their feature details
  const packagesWithFeatures: PackageWithFeatures[] = mockPackages.map((pkg) => ({
    ...pkg,
    featureDetails: pkg.features
      .map((featureId) => mockFeatures.find((f) => f.id === featureId))
      .filter((f): f is Feature => f !== undefined),
  }))

  return NextResponse.json(packagesWithFeatures)
}

export async function POST(request: Request) {
  const body = await request.json()

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, save to database
  const newPackage: Package = {
    id: Date.now().toString(),
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(newPackage)
}
