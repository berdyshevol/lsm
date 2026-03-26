import { Outlet, useParams } from 'react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CourseSidebar } from '@/components/course/CourseSidebar';
import { useCourseDetail } from '@/hooks/useCourses';
import { Breadcrumbs } from './Breadcrumbs';

export function CourseDetailLayout() {
  const { id: courseId } = useParams<{ id: string }>();
  const { data: course } = useCourseDetail(courseId ?? '');

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
          mode="readonly"
          courseId={courseId ?? ''}
          course={course}
        />
      )}
      <SidebarInset>
        <main id="main" className="flex-1 p-6">
          <div className="mx-auto max-w-5xl">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
