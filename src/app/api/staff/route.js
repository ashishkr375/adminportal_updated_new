import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

const allowedOrigins = [
  "https://adminportal-updated-new.vercel.app/",
  'http://localhost:3000',
  'https://faculty-performance-appraisal-performa.vercel.app/',
    "https://nitp.ac.in/",
]

export async function GET(request) {
  try {
    // Add CORS headers
    const response = NextResponse

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const origin = request.headers.get('origin')
    const isAllowedOrigin = allowedOrigins.includes(origin)

    switch (type) {
      case 'all':
        const results = await query(
          `SELECT
            u.*,
            CASE u.role
              WHEN 1 THEN 'SUPER_ADMIN'
              WHEN 2 THEN 'ACADEMIC_ADMIN'
              WHEN 3 THEN 'FACULTY'
              WHEN 4 THEN 'OFFICER'
              WHEN 5 THEN 'STAFF'
              WHEN 6 THEN 'DEPT_ADMIN'
              WHEN 7 THEN 'TENDER_NOTICE_ADMIN'
            END as role_name,
            COALESCE(r.priority, 999) as role_priority,
            COALESCE(dp.priority_order, 999) as designation_priority
          FROM user u
          LEFT JOIN roles r ON (
            CASE u.role
              WHEN 1 THEN 'SUPER_ADMIN'
              WHEN 2 THEN 'ACADEMIC_ADMIN'
              WHEN 3 THEN 'FACULTY'
              WHEN 4 THEN 'OFFICER'
              WHEN 5 THEN 'STAFF'
              WHEN 6 THEN 'DEPT_ADMIN'
              WHEN 7 THEN 'TENDER_NOTICE_ADMIN'
            END = r.role_key
          )
          LEFT JOIN designation_priorities dp ON u.designation = dp.designation
          WHERE u.is_deleted = 0 AND (u.role = 4 OR u.role = 5)
          ORDER BY role_priority ASC, designation_priority ASC, u.name ASC`
        )
        // Transform the results to include role name
        return NextResponse.json(results.map(user => ({
          ...user,
          role: user.role_name // Replace numeric role with string role
        })))

      case 'officers':
        const officerResults = await query(
          `SELECT
            u.*,
            CASE u.role
              WHEN 4 THEN 'OFFICER'
            END as role_name,
            COALESCE(r.priority, 999) as role_priority,
            COALESCE(dp.priority_order, 999) as designation_priority
          FROM user u
          LEFT JOIN roles r ON r.role_key = 'OFFICER'
          LEFT JOIN designation_priorities dp ON u.designation = dp.designation
          WHERE u.is_deleted = 0 AND u.role = 4
          ORDER BY role_priority ASC, designation_priority ASC, u.name ASC`
        )
        return NextResponse.json(officerResults.map(user => ({
          ...user,
          role: user.role_name
        })))

      case 'staff':
        const staffResults = await query(
          `SELECT
            u.*,
            CASE u.role
              WHEN 5 THEN 'STAFF'
            END as role_name,
            COALESCE(r.priority, 999) as role_priority,
            COALESCE(dp.priority_order, 999) as designation_priority
          FROM user u
          LEFT JOIN roles r ON r.role_key = 'STAFF'
          LEFT JOIN designation_priorities dp ON u.designation = dp.designation
          WHERE u.is_deleted = 0 AND u.role = 5
          ORDER BY role_priority ASC, designation_priority ASC, u.name ASC`
        )
        return NextResponse.json(staffResults.map(user => ({
          ...user,
          role: user.role_name
        })))

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Staff API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}