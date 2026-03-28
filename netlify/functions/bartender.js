const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let ingredients;
  try {
    const body = JSON.parse(event.body);
    ingredients = body.ingredients;
    if (!ingredients || typeof ingredients !== 'string') throw new Error('Missing ingredients');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide an ingredients field.' }) };
  }

  const sanitized = ingredients.replace(/<[^>]*>/g, '').substring(0, 300);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured.' }) };
  }

  const payload = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: `You are the house bartender for Cocktail & Sons — a small-batch cocktail syrup company from New Orleans, now made in Colorado by Max Messier. Their syrups include: Spiced Demerara, Oleo Saccharum, Honeysuckle & Peppercorns, Mint & Lemon Verbena, Ginger Honey, Berry Grenadine, Fassionola, Tonic #15, King Cake (seasonal), ZeroNero [red] (N/A spirit), Margarita Mixer, Mojito Mixer. Create ONE bespoke cocktail in the C&S style — classic-inspired, approachable, New Orleans sensibility. Where possible, feature a C&S product. Format in clean HTML only: <h3> for the cocktail name, <p> for a 1-2 sentence description, <ul> for ingredients (each as <li>amount — ingredient), <ol> for method steps, final <p> starting with "Garnish:" for the garnish note. No markdown. No preamble. Start directly with <h3>.`,
    messages: [{ role: 'user', content: `Create a Cocktail & Sons recipe using: ${sanitized}` }],
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            console.error('Anthropic error:', res.statusCode, data);
            resolve({ statusCode: 502, headers, body: JSON.stringify({ error: 'Could not generate a recipe. Please try again.' }) });
            return;
          }
          const html = parsed.content?.[0]?.text || '';
          resolve({ statusCode: 200, headers, body: JSON.stringify({ html }) });
        } catch (e) {
          console.error('Parse error:', e.message);
          resolve({ statusCode: 500, headers, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) });
    });

    req.write(payload);
    req.end();
  });
};
