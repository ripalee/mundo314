interface Env {
  KV?: any;
  DB?: any;
}

interface Context {
  request: Request;
  env: Env;
}

// GET /api/data -> Obtiene el estado global guardado
export const onRequestGet = async (context: Context): Promise<Response> => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, max-age=0',
  };

  try {
    const { env } = context;
    let dataStr: string | null = null;

    if (env.KV) {
      dataStr = await env.KV.get('mundo314_data');
    } else if (env.DB) {
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)'
      ).run();
      const res = await env.DB.prepare('SELECT value FROM store WHERE key = ?')
        .bind('mundo314_data')
        .first<{ value: string }>();
      dataStr = res ? res.value : null;
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: 'NO_BINDING_CONFIGURED' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    if (!dataStr) {
      return new Response(
        JSON.stringify({ ok: true, data: null, message: 'EMPTY' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, data: JSON.parse(dataStr) }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { headers: corsHeaders, status: 500 }
    );
  }
};

// POST /api/data -> Guarda el estado global
export const onRequestPost = async (context: Context): Promise<Response> => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { env, request } = context;
    const body = await request.json();

    const dataStr = JSON.stringify(body);

    if (env.KV) {
      await env.KV.put('mundo314_data', dataStr);
    } else if (env.DB) {
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)'
      ).run();
      await env.DB.prepare(
        'INSERT INTO store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      )
        .bind('mundo314_data', dataStr)
        .run();
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: 'NO_BINDING_CONFIGURED' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, timestamp: Date.now() }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || String(err) }),
      { headers: corsHeaders, status: 500 }
    );
  }
};
