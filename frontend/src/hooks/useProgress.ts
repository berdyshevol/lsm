import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';
import { toast } from 'sonner';
import type { CourseDetail } from '@/hooks/useCourses';

export interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  completedLessonIds: string[];
}

export interface LessonContent {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export function findModuleForLesson(course: CourseDetail, lessonId: string): string | null {
  for (const mod of course.modules) {
    if (mod.lessons.some((l) => l.id === lessonId)) {
      return mod.id;
    }
  }
  return null;
}

export function useProgress(courseId: string) {
  return useQuery<ProgressSummary>({
    queryKey: ['progress', courseId],
    queryFn: () => fetchApi.get<ProgressSummary>(`/api/progress/courses/${courseId}`),
    enabled: !!courseId,
  });
}

export function useMarkLessonComplete(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) =>
      fetchApi.post<ProgressSummary>(
        `/api/progress/courses/${courseId}/lessons/${lessonId}/complete`,
        {},
      ),
    onMutate: async (lessonId) => {
      await queryClient.cancelQueries({ queryKey: ['progress', courseId] });
      const previous = queryClient.getQueryData<ProgressSummary>(['progress', courseId]);
      if (previous && !previous.completedLessonIds.includes(lessonId)) {
        queryClient.setQueryData<ProgressSummary>(['progress', courseId], {
          ...previous,
          completedLessons: previous.completedLessons + 1,
          percentage:
            previous.totalLessons > 0
              ? Math.round(((previous.completedLessons + 1) / previous.totalLessons) * 100)
              : 0,
          completedLessonIds: [...previous.completedLessonIds, lessonId],
        });
      }
      return { previous };
    },
    onError: (_err, _lessonId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['progress', courseId], context.previous);
      }
      toast.error('Could not save progress. Please try again.', { duration: 5000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', courseId] });
    },
  });
}

export function useLesson(
  courseId: string,
  moduleId: string | null,
  lessonId: string,
) {
  return useQuery<LessonContent>({
    queryKey: ['lesson', courseId, moduleId, lessonId],
    queryFn: () =>
      fetchApi.get<LessonContent>(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      ),
    enabled: !!courseId && !!moduleId && !!lessonId,
  });
}
