import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data from the API with loading and error state.
 *   const { data, loading, error, reload, setData } = useData(() => api.listGuides(), []);
 */
export function useData(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(loader);
  latest.current = loader;

  const reload = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await latest.current();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
      return null;
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload, setData };
}
