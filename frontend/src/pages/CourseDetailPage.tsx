import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCourseDetail } from '@/hooks/useCourses';
import { useMyEnrollments, useEnroll } from '@/hooks/useEnrollments';
import { useProgress } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

function CourseDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-2/3 mb-3" />
      <Skeleton className="h-5 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-4/5 mb-8" />
      <Skeleton className="h-10 w-32 mb-6" />
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading: courseLoading, isError: courseError } = useCourseDetail(id ?? '');
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollments();
  const { mutate: enroll, isPending: enrolling } = useEnroll();

  const isLoading = courseLoading || enrollmentsLoading;
  const isEnrolled = enrollments?.some((e) => e.courseId === id) ?? false;

  const { data: progress } = useProgress(isEnrolled && id ? id : '');

  function handleEnroll() {
    if (!id) return;
    enroll(id);
  }

  function handleContinueLearning() {
    if (!id || !course) return;
    const sortedModules = [...(course.modules ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    if (progress) {
      const completedSet = new Set(progress.completedLessonIds);
      for (const mod of sortedModules) {
        const sortedLessons = [...(mod.lessons ?? [])].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
        for (const lesson of sortedLessons) {
          if (!completedSet.has(lesson.id)) {
            void navigate(`/courses/${id}/lessons/${lesson.id}`);
            return;
          }
        }
      }
    }
    // All complete or no progress data — navigate to first lesson
    const firstMod = sortedModules[0];
    const firstLesson = [...(firstMod?.lessons ?? [])].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    )[0];
    if (firstLesson) {
      void navigate(`/courses/${id}/lessons/${firstLesson.id}`);
    } else {
      toast.error('This course has no lessons yet');
    }
  }

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (courseError || !course) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">Course not found</h1>
        <p className="text-muted-foreground">
          This course does not exist or could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">{course.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        by {course.instructor.name}
      </p>
      <p className="text-muted-foreground mb-6">{course.description}</p>

      <div className="mb-8">
        {isEnrolled ? (
          <Button onClick={handleContinueLearning}>Continue Learning</Button>
        ) : (
          <Button onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? 'Enrolling...' : 'Enroll'}
          </Button>
        )}
      </div>

      {isEnrolled && progress && (
        <div className="mb-6 space-y-2">
          <Progress value={progress.percentage} />
          <p className="text-sm text-muted-foreground">
            {progress.completedLessons} of {progress.totalLessons} lessons completed ({progress.percentage}%)
          </p>
        </div>
      )}

    </div>
  );
}
