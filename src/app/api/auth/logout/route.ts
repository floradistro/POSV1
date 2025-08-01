import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('pos_session')?.value;

    if (token) {
      // Call the addify endpoint to end the session
      try {
        await fetch(`${WORDPRESS_URL}/wp-json/addify-mli/v1/session`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-POS-Token': token
          }
        });
      } catch (error) {
        console.error('Failed to end server session:', error);
        // Continue with logout even if server call fails
      }
    }

    // Clear all POS cookies
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('pos_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    response.cookies.set('pos_store_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    response.cookies.set('pos_terminal_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    console.log('✅ User logged out successfully');

    return response;
  } catch (error) {
    console.error('❌ Logout error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to logout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 