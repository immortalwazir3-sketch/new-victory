export const config = { runtime: 'edge' };

export default async function handler(request) {

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return new Response(
      JSON.stringify({ error: { message: 'GROQ_API_KEY not set in Vercel environment variables' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('file');

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: { message: 'No audio file received' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward to Groq Whisper
    const groqForm = new FormData();
    groqForm.append('file', audioFile, audioFile.name || 'recording.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}` },
      body: groqForm
    });

    const data = await groqRes.json();

    return new Response(JSON.stringify(data), {
      status: groqRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: err.message } }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
