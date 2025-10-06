// Blank API endpoint for admin login

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // TODO: Implement actual authentication logic
    // For now, return mock success response

    return NextResponse.json({
      success: true,
      user: {
        id: "1",
        email: email,
        role: "admin",
      },
      token: "mock-jwt-token",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
  }
}
