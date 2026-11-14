import { useEffect, useState } from 'react';
import { businessService, workerService } from '../services/api';
import { toProvider } from '../models/provider';

const loaders = {
  business: (filters) => businessService.getAllBusinesses(filters),
  worker: (filters) => workerService.getWorkers(filters),
};

export default function useProviderResults(type, { search, city, category = '', skill = '', page }, enabled) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState({});
  const key = JSON.stringify([type, search, city, category, skill, page, retry]);
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setResult({ key, status: 'loading' });
    const filters = { search, city, category, page, size: 8, ...(type === 'worker' ? { skill } : {}) };
    Promise.resolve().then(() => loaders[type](filters)).then((response) => {
      if (!response || !Array.isArray(response.content)) throw new Error('The directory returned an invalid response. Please try again.');
      if (active) setResult({ key, status: 'success', items: response.content.map((item) => toProvider(type, item)),
        total: Number.isInteger(response.totalElements) && response.totalElements >= 0 ? response.totalElements : null,
        totalPages: Number.isInteger(response.totalPages) && response.totalPages >= 0 ? response.totalPages : null });
    }).catch((error) => {
      if (active) setResult({ key, status: 'error', error: error.data?.message || error.message || 'Unable to load this directory.' });
    });
    return () => { active = false; };
  }, [type, search, city, category, skill, page, key, enabled]);
  return { ...(result.key === key ? result : { status: 'loading' }), retry: () => setRetry((value) => value + 1) };
}
