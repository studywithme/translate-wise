import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    const responseTime = Date.now() - startTime;
    
    logger.info({
      message: 'Health check requested',
      path: '/api/health',
      responseTime: `${responseTime}ms`,
      status: '200',
      environment: process.env.NODE_ENV || 'development'
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error({
      message: 'Health check failed',
      path: '/api/health',
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
} 