/**
 * Frontend Optimization Hooks
 * Includes caching, debouncing, and performance improvements
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import toast from 'react-hot-toast';

/**
 * Debounce hook for search and filters
 * Reduces API calls significantly
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Optimized client fetching hook with React Query
 * Automatically caches data and deduplicates requests
 */
export const useClientsQuery = (filters = {}) => {
  const defaultFilters = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    search: filters.search || '',
    status: filters.status || '',
    source: filters.source || ''
  };

  return useQuery({
    queryKey: ['clients', defaultFilters],
    queryFn: () => clientService.getAll(defaultFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000, // 10 minutes - cached for 10 min after leaving page
    retry: 1,
    refetchOnWindowFocus: false // Don't refetch when window regains focus
  });
};

/**
 * Single client query hook with caching
 */
export const useClientQuery = (clientId) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId),
    enabled: !!clientId, // Only fetch if clientId exists
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000 // 20 minutes
  });
};

/**
 * Create client mutation
 */
export const useCreateClientMutation = (onSuccess) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => clientService.create(data),
    onSuccess: (data) => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
      onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create client';
      toast.error(message);
    }
  });
};

/**
 * Update client mutation
 */
export const useUpdateClientMutation = (clientId, onSuccess) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => clientService.update(clientId, data),
    onSuccess: (data) => {
      // Update specific client and list
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
      onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update client';
      toast.error(message);
    }
  });
};

/**
 * Delete client mutation
 */
export const useDeleteClientMutation = (onSuccess) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId) => clientService.delete(clientId),
    onSuccess: () => {
      // Refetch entire list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
      onSuccess?.();
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete client';
      toast.error(message);
    }
  });
};

/**
 * Client stats query hook
 */
export const useClientStatsQuery = () => {
  return useQuery({
    queryKey: ['clientStats'],
    queryFn: () => clientService.getStats(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });
};

/**
 * Batch upload mutation
 */
export const useUploadClientsMutation = (onSuccess) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => clientService.importExcel(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Imported: ${data.summary.created} created, ${data.summary.updated} updated`);
      onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    }
  });
};

/**
 * Throttle hook - runs function at most once per interval
 */
export const useThrottle = (callback, delay = 300) => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );
};

/**
 * Previous value hook - useful for comparison
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Mount effect hook - runs only on mount
 */
export const useMount = (callback) => {
  useEffect(() => {
    callback();
  }, []);
};

/**
 * Debounced search hook - combines debounce with filter update
 */
export const useDebouncedSearch = (onSearch, delay = 500) => {
  const [searchValue, setSearchValue] = useState('');
  const debouncedValue = useDebounce(searchValue, delay);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return [searchValue, setSearchValue];
};

export default {
  useDebounce,
  useClientsQuery,
  useClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useClientStatsQuery,
  useUploadClientsMutation,
  useThrottle,
  usePrevious,
  useMount,
  useDebouncedSearch
};
