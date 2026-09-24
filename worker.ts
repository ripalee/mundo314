interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  DB?: any;
  KV?: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API para sincronización de datos globales
    if (url.pathname === '/api/data') {
      const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      };

      if (request.method === 'GET') {
        try {
          let dataStr: string | null = null;
          if (env.DB) {
            await env.DB.prepare(
              'CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)'
            ).run();
            const res = await env.DB.prepare('SELECT value FROM store WHERE key = ?')
              .bind('mundo314_data')
              .first<{ value: string }>();
            dataStr = res ? res.value : null;
          } else if (env.KV) {
            dataStr = await env.KV.get('mundo314_data');
          } else {
            return new Response(JSON.stringify({ ok: false, error: 'NO_BINDING_CONFIGURED' }), {
              headers: corsHeaders,
              status: 200,
            });
          }

          if (!dataStr) {
            return new Response(JSON.stringify({ ok: true, data: null }), {
              headers: corsHeaders,
              status: 200,
            });
          }

          return new Response(JSON.stringify({ ok: true, data: JSON.parse(dataStr) }), {
            headers: corsHeaders,
            status: 200,
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
            headers: corsHeaders,
            status: 500,
          });
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const dataStr = JSON.stringify(body);

          if (env.DB) {
            await env.DB.prepare(
              'CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)'
            ).run();
            await env.DB.prepare(
              'INSERT INTO store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
            )
              .bind('mundo314_data', dataStr)
              .run();
          } else if (env.KV) {
            await env.KV.put('mundo314_data', dataStr);
          } else {
            return new Response(JSON.stringify({ ok: false, error: 'NO_BINDING_CONFIGURED' }), {
              headers: corsHeaders,
              status: 200,
            });
          }

          return new Response(JSON.stringify({ ok: true }), {
            headers: corsHeaders,
            status: 200,
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
            headers: corsHeaders,
            status: 500,
          });
        }
      }
    }

    // Para cualquier otra ruta (HTML, CSS, JS): servir los assets estáticos de la web
    return env.ASSETS.fetch(request);
  },
};
