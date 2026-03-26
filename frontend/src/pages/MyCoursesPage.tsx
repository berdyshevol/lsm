import { useState } from 'react';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useInstructorCourses } from '@/hooks/useCourses';
import { EmptyState } from '@/components/common/EmptyState';
import { CourseCard } from '@/components/course/CourseCard';
import { CreateCourseDialog } from '@/components/course/CreateCourseDialog';
import { useAuth } from '@/hooks/useAuth';


export function MyCoursesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: courses, isLoading, isError, refetch } = useInstructorCourses();
  const { isInstructor } = useAuth();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
        {isInstructor && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load courses"
          description="Something went wrong. Please try again."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && !isError && courses && courses.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to get started"
          action={
            isInstructor ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first course
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !isError && courses && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
              href={`/my-courses/${course.id}/edit`}
            />
          ))}
        </div>
      )}

      <CreateCourseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
