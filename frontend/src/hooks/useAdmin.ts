import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';
import { toast } from 'sonner';
import type { User } from '@/hooks/useAuth';

// Admin user has createdAt in the response
interface AdminUser extends User {
  createdAt: string;
}

// Courses response from GET /api/courses/all
interface AdminCourse {
  id: string;
  title: string;
  description: string;
  instructor: { id: string; name: string; email: string; role: string };
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
}

export function useUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['users'],
    queryFn: () => fetchApi.get<AdminUser[]>('/api/users'),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: User['role'] }) =>
      fetchApi.patch<AdminUser>(`/api/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update role. Please try again.', { duration: 5000 });
    },
  });
}

export function useAllCourses() {
  return useQuery<AdminCourse[]>({
    queryKey: ['courses', 'all'],
    queryFn: () => fetchApi.get<AdminCourse[]>('/api/courses/all'),
  });
}
