import { Link } from 'react-router';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { useProgress } from '@/hooks/useProgress';
import { CourseCard } from '@/components/course/CourseCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function EnrolledSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function EnrolledCourseCard({
  enrollment,
}: {
  enrollment: {
    id: string;
    courseId: string;
    enrolledAt: string;
    course: { title: string; description: string; instructor: { name: string } };
  };
}) {
  const { data: progress } = useProgress(enrollment.courseId);
  return (
    <CourseCard
      key={enrollment.id}
      title={enrollment.course.title}
      description={enrollment.course.description}
      href={`/courses/${enrollment.courseId}`}
      instructorName={enrollment.course.instructor.name}
      variant="enrolled"
      enrolledAt={enrollment.enrolledAt}
      progress={
        progress
          ? {
              percentage: progress.percentage,
              completedLessons: progress.completedLessons,
              totalLessons: progress.totalLessons,
            }
          : undefined
      }
    />
  );
}

export function MyLearningPage() {
  const { data: enrollments, isLoading, isError, refetch } = useMyEnrollments();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Learning</h1>

      {isLoading && <EnrolledSkeletonGrid />}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load enrollments"
          description="Something went wrong. Please try again."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && !isError && enrollments && enrollments.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          description="Start exploring courses to begin your learning journey"
          action={
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && enrollments && enrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <EnrolledCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}
