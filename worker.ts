interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  [key: string]: any;
}

function getD1Database(env: Env) {
  if (env.DB && typeof env.DB.prepare === 'function') return env.DB;
  if (env.db && typeof env.db.prepare === 'function') return env.db;
  for (const key of Object.keys(env)) {
    if (key !== 'ASSETS' && env[key] && typeof env[key].prepare === 'function') {
      return env[key];
    }
  }
  return null;
}

function getKVNamespace(env: Env) {
  if (env.KV && typeof env.KV.get === 'function') return env.KV;
  if (env.kv && typeof env.kv.get === 'function') return env.kv;
  for (const key of Object.keys(env)) {
    if (key !== 'ASSETS' && env[key] && typeof env[key].get === 'function' && typeof env[key].put === 'function') {
      return env[key];
    }
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API para sincronización de datos globales
    if (url.pathname === '/api/data') {
      const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store, max-age=0',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders, status: 204 });
      }

      const db = getD1Database(env);
      const kv = getKVNamespace(env);

      if (request.method === 'GET') {
        try {
          let dataStr: string | null = null;
          if (db) {
            await db.prepare(
              'CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)'
            ).run();
            const res = await db.prepare('SELECT value FROM store WHERE key = ?')
              .bind('mundo314_data')
              .first<{ value: string }>();
            dataStr = res ? res.value : null;
          } else if (kv) {
            dataStr = await kv.get('mundo314_data');
          } else {
            const detectedKeys = Object.keys(env).filter(k => k !== 'ASSETS');
            return new Response(JSON.stringify({ 
              ok: false, 
              error: 'NO_BINDING_CONFIGURED',
              detectedKeys,
              message: 'D1 binding not connected. Add a D1 database binding named DB in Cloudflare Settings -> Bindings.' 
            }), {
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

          if (db) {
            await db.prepare(
              'CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)'
            ).run();
            await db.prepare(
              'INSERT INTO store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
            )
              .bind('mundo314_data', dataStr)
              .run();
          } else if (kv) {
            await kv.put('mundo314_data', dataStr);
          } else {
            const detectedKeys = Object.keys(env).filter(k => k !== 'ASSETS');
            return new Response(JSON.stringify({ 
              ok: false, 
              error: 'NO_BINDING_CONFIGURED',
              detectedKeys,
              message: 'D1 binding not connected.' 
            }), {
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
