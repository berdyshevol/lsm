import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseCatalogItem {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor: { id: string; name: string; email: string; role: string };
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetailModule {
  id: string;
  title: string;
  orderIndex: number;
  lessons: { id: string; title: string; orderIndex: number }[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor: { id: string; name: string; email: string; role: string };
  modules: CourseDetailModule[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  orderIndex: number;
  courseId: string;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export function useInstructorCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses', 'my'],
    queryFn: () => fetchApi.get<Course[]>('/api/courses/my'),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      fetchApi.post<Course>('/api/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
    onError: () => {
      toast.error('Could not save. Please try again.', { duration: 5000 });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string }) =>
      fetchApi.patch<Course>(`/api/courses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
    onError: () => {
      toast.error('Could not update course. Please try again.', { duration: 5000 });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi.delete(`/api/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
    onError: () => {
      toast.error('Could not delete course. Please try again.', { duration: 5000 });
    },
  });
}

export function useCourseModules(courseId: string) {
  return useQuery<CourseModule[]>({
    queryKey: ['courses', courseId, 'modules'],
    queryFn: () => fetchApi.get<CourseModule[]>(`/api/courses/${courseId}/modules`),
    enabled: !!courseId,
  });
}

export function useCreateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; orderIndex: number }) =>
      fetchApi.post<CourseModule>(`/api/courses/${courseId}/modules`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not add module. Please try again.', { duration: 5000 });
    },
  });
}

export function useUpdateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, ...data }: { moduleId: string; title?: string; orderIndex?: number }) =>
      fetchApi.patch<CourseModule>(`/api/courses/${courseId}/modules/${moduleId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not update module. Please try again.', { duration: 5000 });
    },
  });
}

export function useDeleteModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) =>
      fetchApi.delete(`/api/courses/${courseId}/modules/${moduleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not delete module. Please try again.', { duration: 5000 });
    },
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, ...data }: { moduleId: string; title: string; content: string; orderIndex: number }) =>
      fetchApi.post<Lesson>(`/api/courses/${courseId}/modules/${moduleId}/lessons`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not add lesson. Please try again.', { duration: 5000 });
    },
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, lessonId, ...data }: { moduleId: string; lessonId: string; title?: string; content?: string }) =>
      fetchApi.patch<Lesson>(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not update lesson. Please try again.', { duration: 5000 });
    },
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, lessonId }: { moduleId: string; lessonId: string }) =>
      fetchApi.delete(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not delete lesson. Please try again.', { duration: 5000 });
    },
  });
}

export function useCourseCatalog() {
  return useQuery<CourseCatalogItem[]>({
    queryKey: ['courses', 'catalog'],
    queryFn: () => fetchApi.get<CourseCatalogItem[]>('/api/courses'),
  });
}

export function useCourseDetail(id: string) {
  return useQuery<CourseDetail>({
    queryKey: ['courses', id],
    queryFn: () => fetchApi.get<CourseDetail>(`/api/courses/${id}`),
    enabled: !!id,
  });
}
