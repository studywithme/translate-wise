import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 피드백 목록 조회
export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('피드백 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: { message: '피드백 조회 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

// 피드백 작성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rating, content, userId } = body;

    // 필수 필드 검증
    if (!name || !content) {
      return NextResponse.json(
        { success: false, error: { message: '이름과 내용은 필수입니다.' } },
        { status: 400 }
      );
    }

    // 평점 범위 검증 (1-5)
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: { message: '평점은 1-5 사이여야 합니다.' } },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        name,
        rating: rating || 5,
        content,
        userId: userId || null
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('피드백 작성 오류:', error);
    return NextResponse.json(
      { success: false, error: { message: '피드백 작성 중 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
} 