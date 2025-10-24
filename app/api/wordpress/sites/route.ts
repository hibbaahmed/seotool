import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sites, error } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching WordPress sites:', error);
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
    }

    return NextResponse.json({ sites });
  } catch (error) {
    console.error('WordPress sites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, username, password } = body;

    if (!name || !url || !username || !password) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, url, username, password' 
      }, { status: 400 });
    }

    // Test the WordPress connection
    const { WordPressAPI } = await import('@/lib/wordpress/api');
    const testSite = {
      id: 'test',
      name,
      url,
      username,
      password,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const wpAPI = new WordPressAPI(testSite);
    const isConnected = await wpAPI.testConnection();

    if (!isConnected) {
      return NextResponse.json({ 
        error: 'Failed to connect to WordPress site. Please check your credentials.' 
      }, { status: 400 });
    }

    // Save the site to database
    const { data: site, error } = await supabase
      .from('wordpress_sites')
      .insert({
        user_id: user.id,
        name,
        url,
        username,
        password, // In production, encrypt this
        is_active: true,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error saving WordPress site:', error);
      return NextResponse.json({ error: 'Failed to save site' }, { status: 500 });
    }

    return NextResponse.json({ site });
  } catch (error) {
    console.error('WordPress site creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('id');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('wordpress_sites')
      .delete()
      .eq('id', siteId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting WordPress site:', error);
      return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WordPress site deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}