import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Hanya proses request yang menuju ke /api/*
  if (request.nextUrl.pathname.startsWith('/api/')) {
    
    // 1. Ambil Header Keamanan
    const secureHeader = request.headers.get('x-indolingua-secure');
    
    // 2. Cek Validitas (Hardcoded match untuk efisiensi saat ini)
    if (secureHeader !== 'internal-client-v1') {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized Access', 
          message: 'Missing or invalid security header.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  // Lanjut ke Route Handler jika lolos
  return NextResponse.next();
}

// Konfigurasi Matcher: Terapkan middleware ini hanya pada route API
export const config = {
  matcher: '/api/:path*',
};