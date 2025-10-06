// Blank API endpoint for jobs list

import { NextResponse } from "next/server"

export async function GET() {
  try {
    // TODO: Implement actual database queries
    // For now, return mock data

    const mockJobs = [
      {
        id: "1",
        title: "Senior Frontend Developer",
        companyId: "1",
        companyName: "Tech Solutions Inc",
        description:
          "We are looking for an experienced Frontend Developer to join our team. You will be responsible for building responsive web applications using React and TypeScript.",
        postedDate: "2024-03-01T09:00:00Z",
        status: "active",
        location: "San Francisco, CA",
        type: "full-time",
      },
      {
        id: "2",
        title: "Marketing Manager",
        companyId: "2",
        companyName: "Global Marketing Co",
        description:
          "Seeking a creative Marketing Manager to lead our digital marketing campaigns and drive brand awareness across multiple channels.",
        postedDate: "2024-02-28T10:00:00Z",
        status: "active",
        location: "New York, NY",
        type: "full-time",
      },
      {
        id: "3",
        title: "Financial Analyst Intern",
        companyId: "3",
        companyName: "Finance Experts Ltd",
        description:
          "Great opportunity for students to gain hands-on experience in financial analysis and reporting. Will work closely with senior analysts.",
        postedDate: "2024-02-15T14:00:00Z",
        status: "closed",
        location: "Chicago, IL",
        type: "internship",
      },
      {
        id: "4",
        title: "UX/UI Designer",
        companyId: "1",
        companyName: "Tech Solutions Inc",
        description:
          "Join our design team to create beautiful and intuitive user experiences for our web and mobile applications.",
        postedDate: "2024-03-05T11:00:00Z",
        status: "active",
        location: "Remote",
        type: "contract",
      },
    ]

    return NextResponse.json(mockJobs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}
