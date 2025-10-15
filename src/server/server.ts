import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mastra } from '../mastra/index.ts';

// Check for required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required');
  console.log('Please set it by running: export ANTHROPIC_API_KEY=your_api_key_here');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static UI
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Serve homepage at root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Login endpoint for magic link authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please enter a valid email address',
        errorCode: 'InvalidEmail'
      });
    }

    // Check for disposable email domains
    const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com'];
    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) {
      return res.status(400).json({ 
        error: 'Please use a permanent email address',
        errorCode: 'DisposableEmail'
      });
    }

    console.log('🔐 Login attempt for email:', email);

    // In a real application, you would:
    // 1. Store the email in your database
    // 2. Generate a magic link token
    // 3. Send an email with the magic link
    // 4. Handle the callback when user clicks the link

    // For now, we'll just simulate success
    res.json({ 
      success: true, 
      message: 'Magic link sent! Check your email for a secure login link.',
      email: email 
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Auth callback endpoint (for magic link verification)
app.get('/api/auth/callback', async (req, res) => {
  try {
    const { token, email, returnUrl, code, next } = req.query;
    
    // Handle OAuth code exchange (Supabase-style)
    if (code) {
      console.log('🔐 OAuth code callback received');
      
      // In a real application with Supabase, you would:
      // 1. Exchange the code for a session
      // 2. Set authentication cookies
      // 3. Redirect to the appropriate page
      
      // For now, simulate successful OAuth flow
      const redirectUrl = next ? `/${next}` : (returnUrl || '/');
      return res.redirect(`${req.protocol}://${req.get('host')}${redirectUrl}?auth=success&code=${code}`);
    }
    
    // Handle magic link verification
    if (!token || !email) {
      // Redirect to homepage with error
      return res.redirect(`/?error=AuthApiError&message=Invalid authentication link`);
    }

    console.log('🔐 Magic link callback for email:', email);

    // In a real application, you would:
    // 1. Verify the token
    // 2. Create a user session
    // 3. Set authentication cookies
    // 4. Redirect to dashboard

    // For now, redirect to homepage with success parameters
    const redirectUrl = returnUrl ? 
      `/?auth=success&token=${token}&email=${email}&returnUrl=${encodeURIComponent(returnUrl as string)}` :
      `/?auth=success&token=${token}&email=${email}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Auth callback error:', error);
    res.redirect(`/?error=500&message=Authentication failed. Please try again.`);
  }
});

// Alternative auth callback endpoint for compatibility (matches /auth/callback)
app.get('/auth/callback', async (req, res) => {
  try {
    const { token, email, returnUrl, code, next } = req.query;
    
    // Handle OAuth code exchange (Supabase-style)
    if (code) {
      console.log('🔐 OAuth code callback received (compatibility endpoint)');
      
      // In a real application with Supabase, you would:
      // 1. Exchange the code for a session
      // 2. Set authentication cookies
      // 3. Redirect to the appropriate page
      
      // For now, simulate successful OAuth flow
      const redirectUrl = next ? `/${next}` : (returnUrl || '/');
      return res.redirect(`${req.protocol}://${req.get('host')}${redirectUrl}?auth=success&code=${code}`);
    }
    
    // Handle magic link verification
    if (!token || !email) {
      // Redirect to homepage with error
      return res.redirect(`/?error=AuthApiError&message=Invalid authentication link`);
    }

    console.log('🔐 Magic link callback for email (compatibility endpoint):', email);

    // In a real application, you would:
    // 1. Verify the token
    // 2. Create a user session
    // 3. Set authentication cookies
    // 4. Redirect to dashboard

    // For now, redirect to homepage with success parameters
    const redirectUrl = returnUrl ? 
      `/?auth=success&token=${token}&email=${email}&returnUrl=${encodeURIComponent(returnUrl as string)}` :
      `/?auth=success&token=${token}&email=${email}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Auth callback error (compatibility endpoint):', error);
    res.redirect(`/?error=500&message=Authentication failed. Please try again.`);
  }
});

// Auth code error endpoint (for OAuth failures)
app.get('/api/auth/auth-code-error', (req, res) => {
  // Redirect to homepage with OAuth error
  res.redirect('/?error=AuthCodeError&message=Authentication code exchange failed. Please try logging in again.');
});

// Auth confirm endpoint (for OTP verification - email confirmation, password reset, etc.)
app.get('/api/auth/confirm', async (req, res) => {
  try {
    const { token_hash, type, next } = req.query;
    
    console.log('🔐 OTP confirmation request:', { type, hasToken: !!token_hash });

    // Default redirect path
    const defaultRedirect = next ? `/${next}` : '/videos';

    // Create redirect URL without sensitive parameters
    const redirectUrl = new URL(`${req.protocol}://${req.get('host')}${defaultRedirect}`);

    if (token_hash && type) {
      // In a real application with Supabase, you would:
      // 1. Create Supabase client
      // 2. Verify the OTP token
      // 3. Handle the verification result

      console.log('🔐 Verifying OTP token for type:', type);

      // For now, simulate successful OTP verification
      // In production, you would use:
      // const { error } = await supabase.auth.verifyOtp({
      //   type,
      //   token_hash,
      // });

      // Simulate successful verification
      redirectUrl.searchParams.set('auth', 'success');
      redirectUrl.searchParams.set('type', type as string);
      
      if (type === 'email') {
        redirectUrl.searchParams.set('message', 'Email confirmed successfully!');
      } else if (type === 'recovery') {
        redirectUrl.searchParams.set('message', 'Password reset confirmed!');
      } else if (type === 'invite') {
        redirectUrl.searchParams.set('message', 'Invitation accepted!');
      }

      return res.redirect(redirectUrl.toString());
    }

    // If no token or type, redirect to error
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('error', 'InvalidOTP');
    redirectUrl.searchParams.set('message', 'Invalid or missing confirmation token.');

    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('❌ OTP confirmation error:', error);
    
    // Redirect to error page
    const redirectUrl = new URL(`${req.protocol}://${req.get('host')}/`);
    redirectUrl.searchParams.set('error', 'OTPError');
    redirectUrl.searchParams.set('message', 'Confirmation failed. Please try again.');
    
    res.redirect(redirectUrl.toString());
  }
});

// Sign out endpoint
app.post('/api/auth/signout', async (req, res) => {
  try {
    console.log('🔐 Sign out request received');

    // In a real application with Supabase, you would:
    // 1. Create Supabase client
    // 2. Check if user is logged in
    // 3. Sign out the user
    // 4. Clear any server-side sessions/cookies

    // For now, simulate successful sign out
    console.log('✅ User signed out successfully');

    // Redirect to homepage with sign out confirmation
    const redirectUrl = new URL(`${req.protocol}://${req.get('host')}/`);
    redirectUrl.searchParams.set('signout', 'success');
    redirectUrl.searchParams.set('message', 'You have been signed out successfully.');

    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('❌ Sign out error:', error);
    
    // Redirect to homepage with error
    const redirectUrl = new URL(`${req.protocol}://${req.get('host')}/`);
    redirectUrl.searchParams.set('error', 'SignOutError');
    redirectUrl.searchParams.set('message', 'Sign out failed. Please try again.');
    
    res.redirect(redirectUrl.toString());
  }
});

// Also support GET requests for sign out (for direct links)
app.get('/api/auth/signout', async (req, res) => {
  try {
    console.log('🔐 Sign out request received (GET)');

    // In a real application with Supabase, you would:
    // 1. Create Supabase client
    // 2. Check if user is logged in
    // 3. Sign out the user
    // 4. Clear any server-side sessions/cookies

    // For now, simulate successful sign out
    console.log('✅ User signed out successfully');

    // Redirect to homepage with sign out confirmation
    const redirectUrl = new URL(`${req.protocol}://${req.get('host')}/`);
    redirectUrl.searchParams.set('signout', 'success');
    redirectUrl.searchParams.set('message', 'You have been signed out successfully.');

    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('❌ Sign out error:', error);
    
    // Redirect to homepage with error
    const redirectUrl = new URL(`${req.protocol}://${req.get('host')}/`);
    redirectUrl.searchParams.set('error', 'SignOutError');
    redirectUrl.searchParams.set('message', 'Sign out failed. Please try again.');
    
    res.redirect(redirectUrl.toString());
  }
});

// Streaming chat with SEO research agent
app.post('/api/seo-research', async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: 'user' | 'assistant' | 'system'; content: string }[] };
    console.log('🔍 Received SEO research request:', { messageCount: messages.length, lastMessage: messages[messages.length - 1]?.content });
    
    const agent = mastra.getAgent('seoResearchAgent');
    if (!agent) {
      console.error('❌ seoResearchAgent not found in mastra instance');
      res.status(500).json({ error: 'seoResearchAgent not found' });
      return;
    }

    console.log('✅ Found seoResearchAgent, starting stream...');
    const stream = await agent.stream(messages);

    // Switch to SSE only after stream is successfully created
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let tokenCount = 0;

    for await (const chunk of stream.textStream) {
      tokenCount++;
      res.write(`data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`);
    }

    console.log(`✅ SEO research stream completed, sent ${tokenCount} tokens`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ SEO research error:', message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      // If headers already sent for SSE, send an error event then end
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      } catch {}
      res.end();
    }
  }
});

// Streaming chat with image search agent
app.post('/api/image-search', async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: 'user' | 'assistant' | 'system'; content: string }[] };
    console.log('🖼️ Received image search request:', { messageCount: messages.length, lastMessage: messages[messages.length - 1]?.content });
    
    const agent = mastra.getAgent('imageSearchAgent');
    if (!agent) {
      console.error('❌ imageSearchAgent not found in mastra instance');
      res.status(500).json({ error: 'imageSearchAgent not found' });
      return;
    }

    console.log('✅ Found imageSearchAgent, starting stream...');
    const stream = await agent.stream(messages);

    // Switch to SSE only after stream is successfully created
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let tokenCount = 0;

    for await (const chunk of stream.textStream) {
      tokenCount++;
      res.write(`data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`);
    }

    console.log(`✅ Image search stream completed, sent ${tokenCount} tokens`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Image search error:', message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      // If headers already sent for SSE, send an error event then end
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      } catch {}
      res.end();
    }
  }
});

// Streaming chat with content writer agent
app.post('/api/content-writer', async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: 'user' | 'assistant' | 'system'; content: string }[] };
    console.log('✍️ Received content writer request:', { messageCount: messages.length, lastMessage: messages[messages.length - 1]?.content });
    
    const agent = mastra.getAgent('contentWriterAgent');
    if (!agent) {
      console.error('❌ contentWriterAgent not found in mastra instance');
      res.status(500).json({ error: 'contentWriterAgent not found' });
      return;
    }

    console.log('✅ Found contentWriterAgent, starting stream...');
    const stream = await agent.stream(messages);

    // Switch to SSE only after stream is successfully created
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let tokenCount = 0;

    for await (const chunk of stream.textStream) {
      tokenCount++;
      res.write(`data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`);
    }

    console.log(`✅ Content writer stream completed, sent ${tokenCount} tokens`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Content writer error:', message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      // If headers already sent for SSE, send an error event then end
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      } catch {}
      res.end();
    }
  }
});

// Streaming chat with competitive analysis agent
app.post('/api/competitive-analysis', async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: 'user' | 'assistant' | 'system'; content: string }[] };
    console.log('📊 Received competitive analysis request:', { messageCount: messages.length, lastMessage: messages[messages.length - 1]?.content });
    
    const agent = mastra.getAgent('competitiveAnalysisAgent');
    if (!agent) {
      console.error('❌ competitiveAnalysisAgent not found in mastra instance');
      res.status(500).json({ error: 'competitiveAnalysisAgent not found' });
      return;
    }

    console.log('✅ Found competitiveAnalysisAgent, starting stream...');
    const stream = await agent.stream(messages);

    // Switch to SSE only after stream is successfully created
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let tokenCount = 0;

    for await (const chunk of stream.textStream) {
      tokenCount++;
      res.write(`data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`);
    }

    console.log(`✅ Competitive analysis stream completed, sent ${tokenCount} tokens`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Competitive analysis error:', message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      // If headers already sent for SSE, send an error event then end
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      } catch {}
      res.end();
    }
  }
});

// Streaming chat with weatherAgent
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body as { messages: { role: 'user' | 'assistant' | 'system'; content: string }[] };
    console.log('📨 Received chat request:', { messageCount: messages.length, lastMessage: messages[messages.length - 1]?.content });
    
    const agent = mastra.getAgent('weatherAgent');
    if (!agent) {
      console.error('❌ weatherAgent not found in mastra instance');
      res.status(500).json({ error: 'weatherAgent not found' });
      return;
    }

    console.log('✅ Found weatherAgent, starting stream...');
    const stream = await agent.stream(messages);

    // Switch to SSE only after stream is successfully created
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    let tokenCount = 0;

    for await (const chunk of stream.textStream) {
      tokenCount++;
      res.write(`data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`);
    }

    console.log(`✅ Stream completed, sent ${tokenCount} tokens`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Chat error:', message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      // If headers already sent for SSE, send an error event then end
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      } catch {}
      res.end();
    }
  }
});

const basePort = process.env.PORT ? Number(process.env.PORT) : 5173;
function startServer(port: number, attemptsLeft = 5) {
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`UI server listening on http://localhost:${port}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1, attemptsLeft - 1);
    } else {
      throw err;
    }
  });
}

startServer(basePort);



