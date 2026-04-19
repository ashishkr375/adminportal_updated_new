import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { depList } from '@/lib/const'

const allowedOrigins = [
  "https://adminportal-updated-new.vercel.app/",
  'http://localhost:3000',
  'http://localhost:3001',
  'https://faculty-performance-appraisal-performa.vercel.app/',
]

/**
 * GET /api/v2/faculty
 *
 * Lightweight faculty listing API — returns only the fields needed for card display.
 *
 * Query params:
 *   ?type=all          → all faculty (excludes Officers / Other Employees)
 *   ?type=<dept-key>   → faculty for a specific department (uses depList keys)
 *
 * Response shape per faculty:
 *   id, name, image, designation, department, email, ext_no,
 *   research_interest, academic_responsibility,
 *   journal_papers_count, conference_papers_count, ipr_count,
 *   sponsored_projects_count, phd_candidates_count
 */
export async function GET(request) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  const origin = request.headers.get('origin')
  const corsHeaders = allowedOrigins.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin }
    : {}

  // Only 5 count subqueries — exactly what the card needs
  const cardCountSubqueries = `
    (SELECT COUNT(*) FROM journal_papers      WHERE email = u.email) AS journal_papers_count,
    (SELECT COUNT(*) FROM conference_papers   WHERE email = u.email) AS conference_papers_count,
    (SELECT COUNT(*) FROM ipr                 WHERE email = u.email) AS ipr_count,
    (SELECT COUNT(*) FROM sponsored_projects  WHERE email = u.email) AS sponsored_projects_count,
    (SELECT COUNT(*) FROM phd_candidates      WHERE email = u.email) AS phd_candidates_count
  `

  // Core user fields needed by the card
  const cardUserFields = `
    u.id, u.name, u.image, u.designation, u.department,
    u.email, u.ext_no, u.research_interest, u.academic_responsibility
  `

  try {
    let results

    if (type === 'all') {
      results = await query(
        `SELECT
          ${cardUserFields},
          ${cardCountSubqueries}
        FROM user u
        WHERE u.is_deleted = 0
          AND u.department NOT IN ('Officers', 'Other Employees', 'developer', 'Developer')
        ORDER BY u.name ASC`
      )
    } else if (type && depList.has(type)) {
      results = await query(
        `SELECT
          ${cardUserFields},
          ${cardCountSubqueries}
        FROM user u
        WHERE u.department = ?
          AND u.is_deleted = 0
        ORDER BY u.name ASC`,
        [depList.get(type)]
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter. Use type=all or a valid department key.' },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(results, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[v2/faculty API] Error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
