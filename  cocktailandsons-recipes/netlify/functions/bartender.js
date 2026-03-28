exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS headers — update the origin to your Shopify store domain
  const headers = {
    'Access-Control-Allow-Origin': '*', // Replace * with https://store.cocktailandsons.com in production
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let ingredients;
  try {
    const body = JSON.parse(event.body);
    ingredients = body.ingredients;
    if (!ingredients || typeof ingredients !== 'string') throw new Error('Missing ingredients');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please provide an ingredients field.' }) };
  }

  // Sanitize — strip any prompt injection attempts, limit length
  const sanitized = ingredients.replace(/<[^>]*>/g, '').substring(0, 300);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: `You are the house bartender for Cocktail & Sons — a small-batch cocktail syrup company from New Orleans, now made in Colorado by Max Messier. Their syrups include: Spiced Demerara, Oleo Saccharum, Honeysuckle & Peppercorns, Mint & Lemon Verbena, Ginger Honey, Berry Grenadine, Fassionola, Tonic #15, King Cake (seasonal), ZeroNero [red] (N/A spirit), Margarita Mixer, Mojito Mixer. Create ONE bespoke cocktail in the C&S style — classic-inspired, approachable, New Orleans sensibility. Where possible, feature a C&S product. Format in clean HTML only: <h3> for the cocktail name, <p> for a 1-2 sentence description, <ul> for ingredients (each as <li>amount — ingredient), <ol> for method steps, final <p> starting with "Garnish:" for the garnish note. No markdown. No preamble. Start directly with <h3>.`,
        messages: [{ role: 'user', content: `Create a Cocktail & Sons recipe using: ${sanitized}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not generate a recipe right now. Please try again.' }) };
    }

    const data = await response.json();
    const html = data.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ html }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};
