import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, update in database
  const updatedPackage = {
    id: params.id,
    ...body,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(updatedPackage)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, delete from database
  return NextResponse.json({ success: true })
}
