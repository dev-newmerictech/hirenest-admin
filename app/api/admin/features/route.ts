import { NextResponse } from "next/server"
import type { Feature } from "@/lib/types"

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

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(mockFeatures)
}

export async function POST(request: Request) {
  const body = await request.json()

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, save to database
  const newFeature: Feature = {
    id: Date.now().toString(),
    ...body,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json(newFeature)
}
