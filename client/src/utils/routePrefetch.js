let prefetched = false;

const prefetchJobs = [
  () => import('../pages/ClientsPage'),
  () => import('../pages/FollowUpsPage'),
  () => import('../pages/InteractionsPage'),
  () => import('../pages/ClientDetailPage'),
  () => import('../pages/BillQuotationPage'),
  () => import('../pages/SavedQuotationsPage'),
];

const shouldSkipPrefetch = () => {
  if (typeof navigator === 'undefined') return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return false;

  return connection.saveData || /2g/.test(connection.effectiveType || '');
};

export const prefetchPostLoginRoutes = () => {
  if (prefetched || shouldSkipPrefetch()) return;

  prefetched = true;

  const run = () => {
    Promise.allSettled(prefetchJobs.map((job) => job()));
  };

  if (typeof window === 'undefined') {
    run();
    return;
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 3000 });
    return;
  }

  window.setTimeout(run, 1200);
};
