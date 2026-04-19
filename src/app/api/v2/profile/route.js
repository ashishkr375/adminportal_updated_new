import { NextResponse } from 'next/server'
import { query, batchQuery } from '@/lib/db'
import { connectRedis } from '@/lib/redis'

const allowedOrigins = [
  'https://adminportal-updated-new.vercel.app/',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://faculty-performance-appraisal-performa.vercel.app/',
  'https://nitp.ac.in',
]

const SUMMARY_TTL = 10 * 60
const SECTION_TTL = 5 * 60

function summaryKey(email) { return `v2:profile:summary:${email}` }
function sectionKey(email, section) { return `v2:profile:section:${email}:${section}` }

function corsHeaders(origin) {
  return allowedOrigins.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

const SECTION_QUERIES = {
  work_experience:                 [{ key: 'work_experience',                 sql: 'SELECT * FROM work_experience WHERE email = ?' }],
  education:                       [{ key: 'education',                       sql: 'SELECT * FROM education WHERE email = ?' }],
  teaching_engagement:             [{ key: 'teaching_engagement',             sql: 'SELECT * FROM teaching_engagement WHERE email = ?' }],
  memberships:                     [{ key: 'memberships',                     sql: 'SELECT * FROM memberships WHERE email = ?' }],
  phd_candidates:                  [{ key: 'phd_candidates',                  sql: 'SELECT * FROM phd_candidates WHERE email = ?' }],
  project_supervision:             [{ key: 'project_supervision',             sql: 'SELECT * FROM project_supervision WHERE email = ?' }],
  internships:                     [{ key: 'internships',                     sql: 'SELECT * FROM internships WHERE email = ?' }],
  institute_activities:            [{ key: 'institute_activities',            sql: 'SELECT * FROM institute_activities WHERE email = ?' }],
  department_activities:           [{ key: 'department_activities',           sql: 'SELECT * FROM department_activities WHERE email = ?' }],
  talks_and_lectures:              [{ key: 'talks_and_lectures',              sql: 'SELECT * FROM talks_and_lectures WHERE email = ?' }],
  conference_session_chairs:       [{ key: 'conference_session_chairs',       sql: 'SELECT * FROM conference_session_chairs WHERE email = ?' }],
  international_journal_reviewers: [{ key: 'international_journal_reviewers', sql: 'SELECT * FROM international_journal_reviewers WHERE email = ?' }],
  mooc_courses:                    [{ key: 'mooc_courses',                    sql: 'SELECT * FROM mooc_courses WHERE email = ?' }],
  editorial_boards:                [{ key: 'editorial_boards',                sql: 'SELECT * FROM editorial_boards WHERE email = ?' }],
  visits_abroad:                   [{ key: 'visits_abroad',                   sql: 'SELECT * FROM visits_abroad WHERE email = ?' }],
  special_lectures:                [{ key: 'special_lectures',                sql: 'SELECT * FROM special_lectures WHERE email = ?' }],
  honours_awards:                  [{ key: 'honours_awards',                  sql: 'SELECT * FROM honours_awards WHERE email = ?' }],
  journal_papers: [{
    key: 'journal_papers', twoParams: true,
    sql: `SELECT ANY_VALUE(jp.id) AS id, ANY_VALUE(jp.email) AS email,
            ANY_VALUE(jp.authors) AS authors, ANY_VALUE(jp.title) AS title,
            ANY_VALUE(jp.journal_name) AS journal_name, ANY_VALUE(jp.volume) AS volume,
            ANY_VALUE(jp.publication_year) AS publication_year, ANY_VALUE(jp.pages) AS pages,
            ANY_VALUE(jp.journal_quartile) AS journal_quartile,
            ANY_VALUE(jp.publication_date) AS publication_date,
            ANY_VALUE(jp.student_involved) AS student_involved,
            ANY_VALUE(jp.student_details) AS student_details,
            ANY_VALUE(jp.doi_url) AS doi_url, ANY_VALUE(jp.indexing) AS indexing,
            ANY_VALUE(jp.foreign_author_details) AS foreign_author_details,
            ANY_VALUE(jp.nationality_type) AS nationality_type,
            GROUP_CONCAT(jpc_all.email) AS collaboraters
          FROM journal_papers jp
          LEFT JOIN journal_paper_collaborater jpc_all ON jp.id = jpc_all.journal_paper_id
          WHERE jp.email = ? OR jp.id IN (
            SELECT journal_paper_id FROM journal_paper_collaborater WHERE email = ?
          )
          GROUP BY jp.id ORDER BY jp.publication_year DESC`,
  }],
  conference_papers: [{
    key: 'conference_papers', twoParams: true,
    sql: `SELECT cp.*, GROUP_CONCAT(cpc.email) as collaboraters
          FROM conference_papers cp
          LEFT JOIN conference_papers_collaborater cpc ON cp.id = cpc.conference_papers_id
          WHERE cp.email = ? OR cp.id IN (
            SELECT conference_papers_id FROM conference_papers_collaborater WHERE email = ?
          ) GROUP BY cp.id`,
  }],
  sponsored_projects: [{
    key: 'sponsored_projects', twoParams: true,
    sql: `SELECT sp.* FROM sponsored_projects sp WHERE sp.email = ? OR sp.id IN (
            SELECT sponsored_project_id FROM sponsored_projects_collaborater WHERE email = ?)`,
  }],
  consultancy_projects: [{
    key: 'consultancy_projects', twoParams: true,
    sql: `SELECT cp.* FROM consultancy_projects cp WHERE cp.email = ? OR cp.id IN (
            SELECT consultancy_projects_id FROM consultancy_projects_collaborater WHERE email = ?)`,
  }],
  ipr: [{
    key: 'ipr', twoParams: true,
    sql: `SELECT i.* FROM ipr i WHERE i.email = ? OR i.id IN (
            SELECT ipr_id FROM ipr_collaborater WHERE email = ?)`,
  }],
  startups: [{
    key: 'startups', twoParams: true,
    sql: `SELECT s.* FROM startups s WHERE s.email = ? OR s.id IN (
            SELECT startups_id FROM startups_collaborater WHERE email = ?)`,
  }],
  book_chapters: [{
    key: 'book_chapters', twoParams: true,
    sql: `SELECT bc.* FROM book_chapters bc WHERE bc.email = ? OR bc.id IN (
            SELECT book_chapters_id FROM book_chapters_collaborater WHERE email = ?)`,
  }],
  textbooks: [{
    key: 'textbooks', twoParams: true,
    sql: `SELECT tb.* FROM textbooks tb WHERE tb.email = ? OR tb.id IN (
            SELECT textbooks_id FROM textbooks_collaborater WHERE email = ?)`,
  }],
  edited_books: [{
    key: 'edited_books', twoParams: true,
    sql: `SELECT eb.* FROM edited_books eb WHERE eb.email = ? OR eb.id IN (
            SELECT edited_books_id FROM edited_books_collaborater WHERE email = ?)`,
  }],
  workshops_conferences: [{
    key: 'workshops_conferences', twoParams: true,
    sql: `SELECT wc.* FROM workshops_conferences wc WHERE wc.email = ? OR wc.id IN (
            SELECT workshops_conferences_id FROM workshops_conferences_collaborater WHERE email = ?)`,
  }],
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const section = searchParams.get('section')
  const origin = request.headers.get('origin')
  const cors = corsHeaders(origin)

  if (!email) {
    return NextResponse.json({ error: 'email param required' }, { status: 400, headers: cors })
  }

  const redis = await connectRedis()

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  if (section === 'summary') {
    const cached = await redis.get(summaryKey(email))
    if (cached) {
      return NextResponse.json(JSON.parse(cached), { headers: { ...cors, 'X-Cache': 'HIT' } })
    }

    const profileResult = await query(
      'SELECT * FROM user WHERE email = ? AND is_deleted = 0', [email]
    )
    if (!profileResult.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors })
    }

    const [aboutMe, counts] = await Promise.all([
      query('SELECT * FROM about_me WHERE email = ?', [email]),
      query(`SELECT
        (SELECT COUNT(*) FROM journal_papers                WHERE email = ?) AS journal_papers,
        (SELECT COUNT(*) FROM conference_papers             WHERE email = ?) AS conference_papers,
        (SELECT COUNT(*) FROM phd_candidates                WHERE email = ?) AS phd_candidates,
        (SELECT COUNT(*) FROM sponsored_projects            WHERE email = ?) AS sponsored_projects,
        (SELECT COUNT(*) FROM consultancy_projects          WHERE email = ?) AS consultancy_projects,
        (SELECT COUNT(*) FROM startups                      WHERE email = ?) AS startups,
        (SELECT COUNT(*) FROM ipr                           WHERE email = ?) AS ipr,
        (SELECT COUNT(*) FROM book_chapters                 WHERE email = ?) AS book_chapters,
        (SELECT COUNT(*) FROM work_experience               WHERE email = ?) AS work_experience,
        (SELECT COUNT(*) FROM education                     WHERE email = ?) AS education,
        (SELECT COUNT(*) FROM teaching_engagement           WHERE email = ?) AS teaching_engagement,
        (SELECT COUNT(*) FROM memberships                   WHERE email = ?) AS memberships,
        (SELECT COUNT(*) FROM textbooks                     WHERE email = ?) AS textbooks,
        (SELECT COUNT(*) FROM edited_books                  WHERE email = ?) AS edited_books,
        (SELECT COUNT(*) FROM workshops_conferences         WHERE email = ?) AS workshops_conferences,
        (SELECT COUNT(*) FROM project_supervision           WHERE email = ?) AS project_supervision,
        (SELECT COUNT(*) FROM internships                   WHERE email = ?) AS internships,
        (SELECT COUNT(*) FROM institute_activities          WHERE email = ?) AS institute_activities,
        (SELECT COUNT(*) FROM department_activities         WHERE email = ?) AS department_activities,
        (SELECT COUNT(*) FROM talks_and_lectures            WHERE email = ?) AS talks_and_lectures,
        (SELECT COUNT(*) FROM conference_session_chairs     WHERE email = ?) AS conference_session_chairs,
        (SELECT COUNT(*) FROM international_journal_reviewers WHERE email = ?) AS international_journal_reviewers,
        (SELECT COUNT(*) FROM mooc_courses                  WHERE email = ?) AS mooc_courses,
        (SELECT COUNT(*) FROM editorial_boards              WHERE email = ?) AS editorial_boards,
        (SELECT COUNT(*) FROM visits_abroad                 WHERE email = ?) AS visits_abroad,
        (SELECT COUNT(*) FROM special_lectures              WHERE email = ?) AS special_lectures,
        (SELECT COUNT(*) FROM honours_awards                WHERE email = ?) AS honours_awards
      `, Array(27).fill(email)),
    ])

    const summary = { profile: profileResult[0], about_me: aboutMe, counts: counts[0] }
    await redis.setex(summaryKey(email), SUMMARY_TTL, JSON.stringify(summary))
    return NextResponse.json(summary, { headers: { ...cors, 'X-Cache': 'MISS' } })
  }

  // ── SECTION DATA ───────────────────────────────────────────────────────────
  if (section && SECTION_QUERIES[section]) {
    const cached = await redis.get(sectionKey(email, section))
    if (cached) {
      return NextResponse.json(JSON.parse(cached), { headers: { ...cors, 'X-Cache': 'HIT' } })
    }

    const queries = SECTION_QUERIES[section]
    const results = await batchQuery(
      queries.map(q => ({ query: q.sql, values: q.twoParams ? [email, email] : [email] }))
    )

    const data = {}
    queries.forEach((q, i) => {
      let rows = results[i] || []
      if (q.key === 'journal_papers') {
        rows = rows.map(r => ({
          ...r,
          collaboraters: r.collaboraters ? r.collaboraters.split(',').map(s => s.trim()) : [],
        }))
      }
      data[q.key] = rows
    })

    await redis.setex(sectionKey(email, section), SECTION_TTL, JSON.stringify(data))
    return NextResponse.json(data, { headers: { ...cors, 'X-Cache': 'MISS' } })
  }

  return NextResponse.json(
    { error: 'Invalid section. Use section=summary or a valid section key.' },
    { status: 400, headers: cors }
  )
}
