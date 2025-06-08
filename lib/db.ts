import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Configure Neon with connection pooling and performance optimizations
export const sql = neon(process.env.DATABASE_URL, {
  // Enable connection pooling for better performance
  pooling: true,
  // Set reasonable timeouts
  connectionTimeoutMillis: 5000,
  queryTimeoutMillis: 10000,
})

// Helper function to generate unique group codes
export async function generateUniqueGroupCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Check if code already exists with optimized query
    const existing = await sql`
      SELECT 1 FROM groups WHERE code = ${code} LIMIT 1
    `

    if (existing.length === 0) {
      return code
    }

    attempts++
  }

  throw new Error("Unable to generate unique group code")
}

// Helper function to get user ID (in a real app, this would come from authentication)
export function getUserId(request: Request): string {
  // For demo purposes, we'll use a simple session-based approach
  // In production, you'd use proper authentication (NextAuth, Clerk, etc.)
  const userAgent = request.headers.get("user-agent") || "unknown"
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  return `user_${Buffer.from(userAgent + ip)
    .toString("base64")
    .slice(0, 16)}`
}
