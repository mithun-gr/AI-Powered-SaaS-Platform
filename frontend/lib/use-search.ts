import { useState, useEffect, useMemo } from "react";

/**
 * useSearch — high-performance, debounced multi-field search hook.
 *
 * @param items      — the full array to search through
 * @param fields     — keys to search on (nested paths not supported)
 * @param delay      — debounce delay in ms (default 150ms for snappy UX)
 *
 * Usage:
 *   const { query, setQuery, results } = useSearch(requests, ["id", "title", "description"]);
 */
export function useSearch<T extends Record<string, any>>(
  items: T[],
  fields: (keyof T)[],
  delay = 150
) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay]);

  // Memoised filter — only re-runs when items or debouncedQuery changes
  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      fields.some(field => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [items, fields, debouncedQuery]);

  const clearSearch = () => setQuery("");

  return { query, setQuery, results, clearSearch, hasQuery: debouncedQuery.trim().length > 0 };
}
