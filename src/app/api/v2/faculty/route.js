import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { depList } from '@/lib/const'
import { connectRedis } from '@/lib/redis'

const allowedOrigins = [
  "https://adminportal-updated-new.vercel.app/",
  'http://localhost:3000',
  'http://localhost:3001',
  'https://faculty-performance-appraisal-performa.vercel.app/',
]

// 5 minutes — list data changes infrequently but shouldn't be too stale
const CACHE_TTL = 5 * 60
const CACHE_PREFIX = 'v2:faculty:'

function cacheKey(type) {
  return `${CACHE_PREFIX}${type}`
}

/**
 * GET /api/v2/faculty
 *
 * Lightweight listing API — returns only fields needed for card display.
 *
 * Query params:
 *   ?type=all          → all faculty (excludes Officers / Other Employees)
 *   ?type=officers     → officers only (name, image, designation, email + priority order)
 *   ?type=<dept-key>   → faculty for a specific department (uses depList keys)
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
    const redis = await connectRedis()
    let results

    if (type === 'all') {
      // Check cache first
      const cached = await redis.get(cacheKey('all'))
      if (cached) {
        console.log('[v2/faculty] Cache hit: all')
        return NextResponse.json(JSON.parse(cached), {
          headers: { ...corsHeaders, 'X-Cache': 'HIT' },
        })
      }

      results = await query(
        `SELECT
          ${cardUserFields},
          ${cardCountSubqueries}
        FROM user u
        WHERE u.is_deleted = 0
          AND u.department NOT IN ('Officers', 'Other Employees', 'developer', 'Developer')
        ORDER BY u.name ASC`
      )

      await redis.setex(cacheKey('all'), CACHE_TTL, JSON.stringify(results))
      console.log('[v2/faculty] Cached: all')

    } else if (type && depList.has(type)) {
      const cached = await redis.get(cacheKey(type))
      if (cached) {
        console.log(`[v2/faculty] Cache hit: ${type}`)
        return NextResponse.json(JSON.parse(cached), {
          headers: { ...corsHeaders, 'X-Cache': 'HIT' },
        })
      }

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

      await redis.setex(cacheKey(type), CACHE_TTL, JSON.stringify(results))
      console.log(`[v2/faculty] Cached: ${type}`)

    } else if (type === 'others') {
      const cached = await redis.get(cacheKey('others'))
      if (cached) {
        console.log('[v2/faculty] Cache hit: others')
        return NextResponse.json(JSON.parse(cached), {
          headers: { ...corsHeaders, 'X-Cache': 'HIT' },
        })
      }

      results = await query(
        `SELECT u.id, u.name, u.image, u.designation, u.email
        FROM user u
        WHERE u.is_deleted = 0
          AND u.department = 'Other Employees'
        ORDER BY u.name ASC`
      )

      await redis.setex(cacheKey('others'), CACHE_TTL, JSON.stringify(results))
      console.log('[v2/faculty] Cached: others')

    } else if (type === 'officers') {
      const cached = await redis.get(cacheKey('officers'))
      if (cached) {
        console.log('[v2/faculty] Cache hit: officers')
        return NextResponse.json(JSON.parse(cached), {
          headers: { ...corsHeaders, 'X-Cache': 'HIT' },
        })
      }

      results = await query(
        `SELECT
          u.id, u.name, u.image, u.designation, u.email
        FROM user u
        LEFT JOIN designation_priorities dp
          ON REPLACE(REPLACE(LOWER(u.designation), '&', ' & '), '.', '')
           = REPLACE(REPLACE(LOWER(dp.designation), '&', ' & '), '.', '')
        WHERE u.is_deleted = 0
          AND u.department = 'Officers'
        ORDER BY
          COALESCE(dp.priority_order, 999) ASC,
          u.name ASC`
      )

      await redis.setex(cacheKey('officers'), CACHE_TTL, JSON.stringify(results))
      console.log('[v2/faculty] Cached: officers')

    } else {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter. Use type=all or a valid department key.' },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(results, {
      headers: {
        ...corsHeaders,
        'X-Cache': 'MISS',
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
