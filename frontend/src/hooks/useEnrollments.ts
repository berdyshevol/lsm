import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';
import { toast } from 'sonner';

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
}

export interface EnrollmentWithCourse {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    description: string;
    instructorId: string;
    instructor: { id: string; name: string; email: string; role: string };
  };
}

export function useMyEnrollments() {
  return useQuery<EnrollmentWithCourse[]>({
    queryKey: ['enrollments', 'my'],
    queryFn: () => fetchApi.get<EnrollmentWithCourse[]>('/api/enrollments/my'),
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      fetchApi.post<Enrollment>(`/api/enrollments/courses/${courseId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'catalog'] });
      toast.success('Enrolled successfully!', { duration: 3000 });
    },
    onError: (error: { statusCode?: number; message?: string }) => {
      if (error?.statusCode === 409) {
        queryClient.invalidateQueries({ queryKey: ['enrollments', 'my'] });
      }
      const message = error?.message || 'Something went wrong';
      toast.error(Array.isArray(message) ? message[0] : String(message), {
        duration: 5000,
      });
    },
  });
}

export function useEnrollmentStatus(courseId: string) {
  const { data, isLoading } = useMyEnrollments();
  return {
    isEnrolled: data?.some((e) => e.courseId === courseId) ?? false,
    isLoading,
  };
}
