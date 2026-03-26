import { Outlet, useParams } from 'react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CourseSidebar } from '@/components/course/CourseSidebar';
import { useCourseDetail } from '@/hooks/useCourses';
import { useProgress } from '@/hooks/useProgress';
import { Breadcrumbs } from './Breadcrumbs';

export function LessonLayout() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const { data: course } = useCourseDetail(courseId ?? '');
  const { data: progress } = useProgress(courseId ?? '');

  return (
    <SidebarProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
      >
        Skip to content
      </a>
      {course && (
        <CourseSidebar
          courseId={courseId ?? ''}
          lessonId={lessonId ?? ''}
          course={course}
          progress={progress}
        />
      )}
      <SidebarInset>
        <main id="main" className="flex-1 p-6">
          <div className="mx-auto max-w-3xl">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
