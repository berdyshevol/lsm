import React from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { CourseDetail, Course } from '@/hooks/useCourses';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

function getSegments(
  pathname: string,
  id: string | undefined,
  lessonId: string | undefined,
  queryClient: ReturnType<typeof useQueryClient>,
): BreadcrumbSegment[] | null {
  // Top-level pages — hide breadcrumbs
  if (pathname === '/my-learning' || pathname === '/my-courses' || pathname === '/courses') {
    return null;
  }

  // /courses/:id/lessons/:lessonId
  if (id && lessonId) {
    const course = queryClient.getQueryData<CourseDetail>(['courses', id]);
    const mod = course?.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
    const lesson = mod?.lessons.find((l) => l.id === lessonId);
    return [
      { label: 'Courses', href: '/courses' },
      { label: course?.title ?? id, href: `/courses/${id}` },
      { label: mod?.title ?? '...' },
      { label: lesson?.title ?? lessonId },
    ];
  }

  // /courses/:id
  if (id && /^\/courses\/[^/]+$/.test(pathname)) {
    const course = queryClient.getQueryData<CourseDetail>(['courses', id]);
    return [
      { label: 'Courses', href: '/courses' },
      { label: course?.title ?? id },
    ];
  }

  // /my-courses/:id/edit
  if (id && /^\/my-courses\/[^/]+\/edit$/.test(pathname)) {
    const courses = queryClient.getQueryData<Course[]>(['courses', 'my']);
    const course = courses?.find((c) => c.id === id);
    return [
      { label: 'My Courses', href: '/my-courses' },
      { label: course ? `Edit: ${course.title}` : 'Edit Course' },
    ];
  }

  // /admin/users
  if (pathname === '/admin/users') {
    return [{ label: 'Admin' }, { label: 'Users' }];
  }

  // /admin/courses
  if (pathname === '/admin/courses') {
    return [{ label: 'Admin' }, { label: 'Courses' }];
  }

  return null;
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const { id, lessonId } = useParams<{ id?: string; lessonId?: string }>();
  const queryClient = useQueryClient();

  const segments = getSegments(pathname, id, lessonId, queryClient);

  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:block mb-4">
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            return (
              <React.Fragment key={`${segment.label}-${index}`}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                  ) : segment.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={segment.href}>{segment.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <span className="text-muted-foreground">{segment.label}</span>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
