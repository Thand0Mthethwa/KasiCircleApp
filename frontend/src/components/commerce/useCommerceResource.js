import { useEffect, useState } from 'react';

export default function useCommerceResource(load) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    load().then(
      (data) => { if (active) setResult({ load, version, data }); },
      (error) => { if (active) setResult({ load, version, error }); },
    );
    return () => { active = false; };
  }, [load, version]);
  const current = result?.load === load && result.version === version ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    retry: () => setVersion((value) => value + 1),
  };
}
