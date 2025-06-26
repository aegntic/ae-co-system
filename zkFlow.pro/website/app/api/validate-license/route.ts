import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, deviceId } = await req.json()

    if (!licenseKey || !deviceId) {
      return NextResponse.json(
        { error: 'License key and device ID are required' },
        { status: 400 }
      )
    }

    // Validate license using Supabase function
    const { data, error } = await supabase.rpc('validate_license', {
      p_license_key: licenseKey,
      p_device_id: deviceId,
    })

    if (error) {
      console.error('License validation error:', error)
      return NextResponse.json(
        { error: 'License validation failed' },
        { status: 500 }
      )
    }

    const result = data[0]

    if (!result.is_valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 403 }
      )
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, subscription_tier')
      .eq('id', result.user_id)
      .single()

    return NextResponse.json({
      valid: true,
      tier: result.tier,
      user: {
        email: profile?.email,
        name: profile?.full_name,
        tier: profile?.subscription_tier,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow CORS for extension
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}