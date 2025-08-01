// Debug utility for authentication issues
export class AuthDebugger {
  static logEnvironment() {
    console.log('🔍 Auth Debug Info:')
    console.log('- Environment:', process.env.NODE_ENV)
    console.log('- WordPress URL:', process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com (default)')
    console.log('- WC Consumer Key:', process.env.WC_CONSUMER_KEY ? 'Set' : 'Using default')
    console.log('- WC Consumer Secret:', process.env.WC_CONSUMER_SECRET ? 'Set' : 'Using default')
    console.log('- Current domain:', typeof window !== 'undefined' ? window.location.origin : 'Server-side')
  }

  static async testConnection() {
    const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'
    const testUrl = `${API_BASE}/wp-json/addify-mli/v1/stores/public`
    
    console.log('🌐 Testing connection to:', testUrl)
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Connection successful, stores available:', data.length || 'Unknown')
        return { success: true, data }
      } else {
        const errorText = await response.text()
        console.log('❌ Connection failed:', errorText)
        return { success: false, error: errorText }
      }
    } catch (error) {
      console.log('💥 Network error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  static async testAuth(email: string, password: string, storeId: string, terminalId: string) {
    const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://api.floradistro.com'
    const authUrl = `${API_BASE}/wp-json/addify-mli/v1/auth/login`
    
    console.log('🔐 Testing auth to:', authUrl)
    console.log('📝 Credentials:', {
      email,
      storeId,
      terminalId,
      passwordLength: password?.length || 0
    })
    
    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          store_id: parseInt(storeId),
          terminal_id: terminalId
        })
      })
      
      console.log('📡 Auth response status:', response.status)
      console.log('📡 Auth response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('📄 Raw response:', responseText)
      
      try {
        const data = JSON.parse(responseText)
        console.log('📊 Parsed response:', data)
        return { success: response.ok, data, status: response.status }
      } catch (parseError) {
        console.log('❌ JSON parse error:', parseError)
        return { success: false, error: 'Invalid JSON response', rawResponse: responseText, status: response.status }
      }
    } catch (error) {
      console.log('💥 Auth network error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
} 