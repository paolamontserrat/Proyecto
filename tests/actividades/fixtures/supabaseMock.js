import { vi } from "vitest";

export const supabase = {
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
  rpc: vi.fn(),
};

export function configureSupabase({
  queryData = null,
  queryError = null,
  singleData = null,
  singleError = null,
} = {}) {
  const query = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.maybeSingle = vi.fn(() =>
    singleError
      ? Promise.reject(singleError)
      : Promise.resolve({ data: singleData, error: null }),
  );
  query.upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
  query.then = (resolve, reject) =>
    (queryError
      ? Promise.reject(queryError)
      : Promise.resolve({ data: queryData, error: null })
    ).then(resolve, reject);

  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn(() => channel),
  };

  supabase.from.mockReturnValue(query);
  supabase.channel.mockReturnValue(channel);
  supabase.removeChannel.mockResolvedValue(undefined);
  supabase.rpc.mockResolvedValue({ data: { ok: true, nuevo: false }, error: null });

  return query;
}
