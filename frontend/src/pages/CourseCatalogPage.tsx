import { AlertCircle } from 'lucide-react';
import { useCourseCatalog } from '@/hooks/useCourses';
import { CourseCard } from '@/components/course/CourseCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function CatalogSkeletonGrid() {
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
            <Skeleton className="h-5 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function CourseCatalogPage() {
  const { data: courses, isLoading, isError, refetch } = useCourseCatalog();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>

      {isLoading && <CatalogSkeletonGrid />}

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
          icon={AlertCircle}
          title="No courses available"
          description="Check back soon for new courses."
        />
      )}

      {!isLoading && !isError && courses && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
              href={`/courses/${course.id}`}
              instructorName={course.instructor.name}
              variant="catalog"
              lessonCount={course.lessonCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
