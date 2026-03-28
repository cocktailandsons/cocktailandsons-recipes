# Cocktail & Sons — Recipe App + AI Bartender

## How it works

The AI Bartender sends customer ingredient requests to a Netlify
serverless function. That function holds your Anthropic API key
securely on the server and calls Claude — customers never see the key.

---

## Deploy in 5 steps (free, ~10 minutes)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com and sign up (free)
2. Click **API Keys** in the left sidebar
3. Click **Create Key**, name it "cocktailandsons", copy the key
   — it starts with `sk-ant-`

### Step 2 — Put these files on GitHub
1. Go to https://github.com and create a free account if needed
2. Click **New repository**, name it `cocktailandsons-recipes`
3. Set it to **Private**, click **Create repository**
4. Upload ALL files from this folder — keeping the folder structure:
   ```
   index.html
   netlify.toml
   netlify/
     functions/
       bartender.js
   ```

### Step 3 — Deploy to Netlify
1. Go to https://netlify.com and sign up free (use your GitHub account)
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** and select `cocktailandsons-recipes`
4. Leave all build settings blank — click **Deploy site**
5. Netlify will give you a URL like `https://jolly-cupcake-abc123.netlify.app`
   — you can rename this to something custom like `cocktailandsons-recipes`

### Step 4 — Add your API key to Netlify
1. In your Netlify site dashboard, go to **Site configuration → Environment variables**
2. Click **Add a variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: paste your `sk-ant-…` key
5. Click **Save** — Netlify will redeploy automatically

### Step 5 — Embed in Shopify
The recipe app is now live at your Netlify URL. To embed it in Shopify:

**Option A — Dedicated page (recommended)**
1. In Shopify Admin → **Online Store → Pages → Add page**
2. Click `<>` (HTML editor) and paste:
   ```html
   <iframe
     src="https://YOUR-SITE.netlify.app"
     width="100%"
     height="900px"
     style="border:none;"
     title="Cocktail & Sons Recipe Collection">
   </iframe>
   ```
3. Adjust the height to taste and save

**Option B — Theme section**
1. In Shopify Admin → **Online Store → Themes → Customize**
2. Add a **Custom HTML** section anywhere on the page
3. Paste the iframe code from Option A

---

## Locking down the API (optional but recommended)

Once live, update line 7 of `netlify/functions/bartender.js`:

```js
// Change this:
'Access-Control-Allow-Origin': '*',

// To your Shopify store domain only:
'Access-Control-Allow-Origin': 'https://store.cocktailandsons.com',
```

Commit the change to GitHub — Netlify redeploys automatically.
This ensures only your store can use the AI Bartender, not anyone else.

---

## Costs

- **Netlify**: Free tier includes 125,000 function calls/month — more than enough
- **Anthropic**: Claude Haiku (used here) costs ~$0.001 per recipe generated
  — 1,000 recipes = roughly $1. Set a spend limit at console.anthropic.com.
