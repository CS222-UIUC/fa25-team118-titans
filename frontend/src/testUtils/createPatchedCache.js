import { InMemoryCache } from '@apollo/client';

export const createPatchedCache = () => {
  const cache = new InMemoryCache();
  const originalDiff = cache.diff.bind(cache);

  cache.diff = (options = {}) => {
    const { canonizeResults: _omitCanonizeResults, ...rest } = options;
    return originalDiff(rest);
  };

  return cache;
};
