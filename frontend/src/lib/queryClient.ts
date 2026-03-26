import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message =
          (error as Record<string, unknown>)?.message || 'Something went wrong';
        toast.error(Array.isArray(message) ? message[0] : String(message), {
          duration: 5000,
        });
      },
    },
  },
});
