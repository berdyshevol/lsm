import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CourseCardProps {
  title: string;
  description: string;
  href: string;
  instructorName?: string;
  variant?: 'catalog' | 'enrolled';
  lessonCount?: number;
  enrolledAt?: string;
  progress?: { percentage: number; completedLessons: number; totalLessons: number };
}

export function CourseCard({
  title,
  description,
  href,
  instructorName,
  variant,
  lessonCount,
  enrolledAt,
  progress,
}: CourseCardProps) {
  return (
    <Link to={href} aria-label={title}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {instructorName && (
            <p className="text-sm text-muted-foreground">{instructorName}</p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
        {variant && (
          <CardFooter>
            {variant === 'catalog' && lessonCount !== undefined && (
              <Badge variant="secondary">{lessonCount} lessons</Badge>
            )}
            {variant === 'enrolled' && enrolledAt && !progress && (
              <p className="text-xs text-muted-foreground">
                Enrolled {new Date(enrolledAt).toLocaleDateString()}
              </p>
            )}
            {progress && (
              <div className="w-full space-y-1 pt-2">
                <Progress value={progress.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {progress.completedLessons} of {progress.totalLessons} lessons completed
                </p>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
