const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API = 'https://api.github.com';
const ALLOWED_ORIGIN = 'https://healthcare-allocation-lab.github.io';
const SITE_ORIGIN = 'https://healthcare-allocation-lab.github.io';
const ORG_NAME = 'Healthcare-Allocation-Lab';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/auth') {
      return handleAuth(url, env);
    }

    if (url.pathname === '/callback') {
      return handleCallback(url, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

function handleAuth(url, env) {
  const siteLogin = url.searchParams.get('site_login') === 'true';
  const state = siteLogin ? 'site_login:' + crypto.randomUUID() : 'cms:' + crypto.randomUUID();
  const scope = siteLogin ? 'read:org,user' : 'repo,user';

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope,
    state,
  });
  return Response.redirect(`${GITHUB_AUTHORIZE_URL}?${params}`, 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  // Exchange code for token
  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenResponse.json();

  if (data.error) {
    return new Response(`OAuth error: ${data.error_description || data.error}`, {
      status: 400,
    });
  }

  const token = data.access_token;

  // Route based on state prefix
  if (state.startsWith('site_login:')) {
    return handleSiteLogin(token);
  }

  // Default: CMS flow (Decap postMessage handshake)
  return handleCmsLogin(token);
}

async function handleSiteLogin(token) {
  try {
    // Get user info
    const userRes = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'HCA-Lab-OAuth-Proxy',
      },
    });

    if (!userRes.ok) {
      return Response.redirect(`${SITE_ORIGIN}/resources.html?auth_error=github_api`, 302);
    }

    const user = await userRes.json();
    const username = user.login;
    const avatar = user.avatar_url;

    // Check org membership
    const memberRes = await fetch(`${GITHUB_API}/orgs/${ORG_NAME}/members/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'HCA-Lab-OAuth-Proxy',
      },
    });

    if (memberRes.status !== 204) {
      // Not a member — revoke token and redirect with error
      return Response.redirect(`${SITE_ORIGIN}/resources.html?auth_error=not_member`, 302);
    }

    // Member confirmed — redirect with token in hash fragment
    const params = new URLSearchParams({
      auth_token: token,
      username: username,
      avatar: avatar,
    });
    return Response.redirect(`${SITE_ORIGIN}/resources.html#${params.toString()}`, 302);
  } catch (e) {
    return Response.redirect(`${SITE_ORIGIN}/resources.html?auth_error=server_error`, 302);
  }
}

function handleCmsLogin(token) {
  // Render a page that uses the Decap CMS postMessage handshake protocol:
  // 1. Popup sends "authorizing:github" to opener to announce readiness
  // 2. CMS responds with "authorizing:github" back to popup
  // 3. Popup receives confirmation and sends the token
  const content = JSON.stringify({ token, provider: 'github' });
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authorizing...</title></head>
<body>
<p>Authorizing with GitHub...</p>
<script>
(function() {
  window.addEventListener('message', function(e) {
    if (e.data === 'authorizing:github') {
      window.opener.postMessage(
        'authorization:github:success:' + ${JSON.stringify(content)},
        e.origin
      );
    }
  });
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
