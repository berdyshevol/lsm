import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import ReactMarkdown from 'react-markdown';
import { useCourseDetail } from '@/hooks/useCourses';
import { useEnrollmentStatus } from '@/hooks/useEnrollments';
import { useLesson, useProgress, useMarkLessonComplete, findModuleForLesson } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function LessonViewSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-2/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-4/5 mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-6" />
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

export function LessonViewPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const navigate = useNavigate();

  const { isEnrolled, isLoading: enrollmentLoading } = useEnrollmentStatus(courseId ?? '');
  const { data: course, isLoading: courseLoading } = useCourseDetail(courseId ?? '');

  const moduleId = course && lessonId ? findModuleForLesson(course, lessonId) : null;

  const { data: lesson, isLoading: lessonLoading, isError: lessonError, error: lessonErrorData } = useLesson(
    courseId ?? '',
    moduleId,
    lessonId ?? '',
  );

  const { data: progress, isLoading: progressLoading } = useProgress(courseId ?? '');
  const { mutate: markComplete, isPending: markingComplete } = useMarkLessonComplete(courseId ?? '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonId]);

  useEffect(() => {
    if (!enrollmentLoading && !isEnrolled && courseId) {
      void navigate(`/courses/${courseId}`, { replace: true });
    }
  }, [enrollmentLoading, isEnrolled, courseId, navigate]);

  const isLoading = enrollmentLoading || courseLoading || lessonLoading || progressLoading;

  if (isLoading) {
    return <LessonViewSkeleton />;
  }

  if (lessonError) {
    const statusCode = (lessonErrorData as { statusCode?: number })?.statusCode;
    if (statusCode === 403) {
      void navigate(`/courses/${courseId}`, { replace: true });
      return null;
    }
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">Lesson not found</h1>
        <p className="text-muted-foreground">This lesson does not exist or could not be loaded.</p>
      </div>
    );
  }

  if (!lesson) {
    if (course && !moduleId) {
      return (
        <div>
          <h1 className="text-3xl font-bold mb-2">Lesson not found</h1>
          <p className="text-muted-foreground">This lesson does not exist or could not be loaded.</p>
        </div>
      );
    }
    return null;
  }

  const isCompleted = progress?.completedLessonIds.includes(lessonId ?? '') ?? false;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown>{lesson.content}</ReactMarkdown>
      </div>
      <div className="mt-8">
        <Button
          disabled={isCompleted || markingComplete}
          onClick={() => {
            if (lessonId) markComplete(lessonId);
          }}
        >
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </Button>
      </div>
    </div>
  );
}
