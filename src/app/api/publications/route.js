import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { depList } from '@/lib/const'
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    let results
    switch (type) {
      case 'all':
        const conference_papers = await query(
          `SELECT * FROM conference_papers LIMIT ? OFFSET ?`,
          [limit, offset]
        );
        const textbooks_data = await query(
          `SELECT * FROM textbooks LIMIT ? OFFSET ?`,
          [limit, offset]
        );
        const journal_papers = await query(
          `SELECT * FROM journal_papers LIMIT ? OFFSET ?`,
          [limit, offset]
        );
        const book_chapters = await query(
          `SELECT * FROM book_chapters LIMIT ? OFFSET ?`,
          [limit, offset]
        );
        const data = [...conference_papers,...textbooks_data,...journal_papers,...book_chapters];
        return NextResponse.json(data);

      default:
        if (depList.has(type)) {
          const textbooks_data = await query(
            `SELECT * FROM user u 
            JOIN textbooks t 
            ON u.email = t.email 
            WHERE u.department = ?
            LIMIT ? OFFSET ?`,
            [depList.get(type), limit, offset]
          );
          const journal_papers = await query(
            `SELECT * FROM user u 
            JOIN journal_papers jp 
            ON u.email = jp.email 
            WHERE u.department = ?
            LIMIT ? OFFSET ?`,
            [depList.get(type), limit, offset]
          );
          const book_chapters = await query(
            `SELECT * FROM user u 
            JOIN book_chapters bc 
            ON u.email = bc.email 
            WHERE u.department = ?
            LIMIT ? OFFSET ?`,
            [depList.get(type), limit, offset]
          );
          const data = [...textbooks_data, ...journal_papers, ...book_chapters];
          return NextResponse.json(data);
        } else {
          return NextResponse.json(
            { message: 'Invalid type parameter' },
            { status: 400 }
          )
        }
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }
}
