import { Link } from 'react-router';
import { Check, Circle } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CourseDetail } from '@/hooks/useCourses';
import type { ProgressSummary } from '@/hooks/useProgress';
import { cn } from '@/lib/utils';

interface CourseSidebarProps {
  courseId: string;
  course: CourseDetail;
  mode?: 'interactive' | 'readonly';
  lessonId?: string;
  progress?: ProgressSummary;
}

export function CourseSidebar({ courseId, lessonId, course, progress, mode = 'interactive' }: CourseSidebarProps) {
  const isReadonly = mode === 'readonly';
  const completedSet = new Set(progress?.completedLessonIds ?? []);
  const sortedModules = [...(course.modules ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  const defaultOpenValues = sortedModules.map((m) => m.id);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="font-semibold text-sm leading-tight" asChild>
              <Link to={`/courses/${courseId}`}>{course.title}</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!isReadonly && progress !== undefined && (
          <div className="px-2 pb-2 space-y-1">
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.completedLessons} of {progress.totalLessons} lessons completed
            </p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="flex-1 overflow-y-auto">
          <Accordion type="multiple" defaultValue={defaultOpenValues} className="px-2">
            {sortedModules.map((module) => {
              const sortedLessons = [...(module.lessons ?? [])].sort(
                (a, b) => a.orderIndex - b.orderIndex,
              );
              return (
                <AccordionItem key={module.id} value={module.id} className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2 hover:no-underline">
                    {module.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <ul className="space-y-0.5">
                      {sortedLessons.map((lesson) => {
                        const isCompleted = completedSet.has(lesson.id);
                        const isActive = lessonId ? lesson.id === lessonId : false;
                        return (
                          <li key={lesson.id}>
                            {isReadonly ? (
                              <span
                                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                              >
                                <span className="line-clamp-2">{lesson.title}</span>
                              </span>
                            ) : (
                              <Link
                                to={`/courses/${courseId}/lessons/${lesson.id}`}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                  'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer',
                                  isActive && 'bg-muted font-medium',
                                )}
                              >
                                {isCompleted ? (
                                  <Check className="size-4 shrink-0 text-green-500" />
                                ) : (
                                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="line-clamp-2">{lesson.title}</span>
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
