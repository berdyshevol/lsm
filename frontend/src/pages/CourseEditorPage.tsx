import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, BookOpen, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

import {
  useInstructorCourses,
  useUpdateCourse,
  useDeleteCourse,
  useCourseModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from '@/hooks/useCourses';
import type { CourseModule, Lesson } from '@/hooks/useCourses';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { ModuleFormDialog } from '@/components/course/ModuleFormDialog';
import { LessonFormDialog } from '@/components/course/LessonFormDialog';

const courseEditSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().trim().min(1, 'Description is required').max(5000, 'Description too long'),
});

type CourseFormData = z.infer<typeof courseEditSchema>;

export function CourseEditorPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch course from cached instructor courses query
  const { data: courses, isLoading: isCoursesLoading, isError: isCoursesError, refetch: refetchCourses } =
    useInstructorCourses();
  const course = courses?.find((c) => c.id === courseId);

  // Fetch modules + lessons
  const {
    data: modules,
    isLoading: isModulesLoading,
    isError: isModulesError,
    refetch: refetchModules,
  } = useCourseModules(courseId ?? '');

  // Mutations
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const createModule = useCreateModule(courseId ?? '');
  const updateModule = useUpdateModule(courseId ?? '');
  const deleteModule = useDeleteModule(courseId ?? '');
  const createLesson = useCreateLesson(courseId ?? '');
  const updateLesson = useUpdateLesson(courseId ?? '');
  const deleteLesson = useDeleteLesson(courseId ?? '');

  // Course form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseEditSchema),
    values: course ? { title: course.title, description: course.description } : undefined,
  });

  // Delete course dialog
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false);

  // Module dialogs state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [moduleDialogMode, setModuleDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [deleteModuleOpen, setDeleteModuleOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<CourseModule | null>(null);

  // Lesson dialogs state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonDialogMode, setLessonDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState<string>('');
  const [deleteLessonOpen, setDeleteLessonOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<{ lesson: Lesson; moduleId: string } | null>(null);

  // ---- Course handlers ----
  const onSaveCourse = (data: CourseFormData) => {
    if (!courseId || updateCourse.isPending) return;
    updateCourse.mutate(
      { id: courseId, ...data },
      {
        onSuccess: () => {
          toast.success('Course updated!');
        },
      },
    );
  };

  const onConfirmDeleteCourse = () => {
    if (!courseId || deleteCourse.isPending) return;
    deleteCourse.mutate(courseId, {
      onSuccess: () => {
        toast.success('Course deleted');
        navigate('/my-courses');
      },
    });
  };

  // ---- Module handlers ----
  const handleAddModule = () => {
    setSelectedModule(null);
    setModuleDialogMode('create');
    setModuleDialogOpen(true);
  };

  const handleEditModule = (mod: CourseModule) => {
    setSelectedModule(mod);
    setModuleDialogMode('edit');
    setModuleDialogOpen(true);
  };

  const handleDeleteModule = (mod: CourseModule) => {
    setModuleToDelete(mod);
    setDeleteModuleOpen(true);
  };

  const onModuleSubmit = (data: { title: string }) => {
    if (!courseId) return;
    if (createModule.isPending || updateModule.isPending) return;
    if (moduleDialogMode === 'create') {
      createModule.mutate(
        { title: data.title, orderIndex: modules?.length ?? 0 },
        {
          onSuccess: () => {
            toast.success('Module added!');
            setModuleDialogOpen(false);
          },
        },
      );
    } else if (selectedModule) {
      updateModule.mutate(
        { moduleId: selectedModule.id, title: data.title },
        {
          onSuccess: () => {
            toast.success('Module updated!');
            setModuleDialogOpen(false);
          },
        },
      );
    }
  };

  const onConfirmDeleteModule = () => {
    if (!moduleToDelete || deleteModule.isPending) return;
    deleteModule.mutate(moduleToDelete.id, {
      onSuccess: () => {
        toast.success('Module deleted');
        setDeleteModuleOpen(false);
        setModuleToDelete(null);
      },
    });
  };

  // ---- Lesson handlers ----
  const handleAddLesson = (moduleId: string) => {
    setSelectedLesson(null);
    setLessonModuleId(moduleId);
    setLessonDialogMode('create');
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson, moduleId: string) => {
    setSelectedLesson(lesson);
    setLessonModuleId(moduleId);
    setLessonDialogMode('edit');
    setLessonDialogOpen(true);
  };

  const handleDeleteLesson = (lesson: Lesson, moduleId: string) => {
    setLessonToDelete({ lesson, moduleId });
    setDeleteLessonOpen(true);
  };

  const onLessonSubmit = (data: { title: string; content: string }) => {
    if (!courseId) return;
    if (createLesson.isPending || updateLesson.isPending) return;
    const mod = modules?.find((m) => m.id === lessonModuleId);
    if (lessonDialogMode === 'create') {
      createLesson.mutate(
        {
          moduleId: lessonModuleId,
          title: data.title,
          content: data.content,
          orderIndex: mod?.lessons.length ?? 0,
        },
        {
          onSuccess: () => {
            toast.success('Lesson added!');
            setLessonDialogOpen(false);
          },
        },
      );
    } else if (selectedLesson) {
      updateLesson.mutate(
        {
          moduleId: lessonModuleId,
          lessonId: selectedLesson.id,
          title: data.title,
          content: data.content,
        },
        {
          onSuccess: () => {
            toast.success('Lesson updated!');
            setLessonDialogOpen(false);
          },
        },
      );
    }
  };

  const onConfirmDeleteLesson = () => {
    if (!lessonToDelete || deleteLesson.isPending) return;
    deleteLesson.mutate(
      { moduleId: lessonToDelete.moduleId, lessonId: lessonToDelete.lesson.id },
      {
        onSuccess: () => {
          toast.success('Lesson deleted');
          setDeleteLessonOpen(false);
          setLessonToDelete(null);
        },
      },
    );
  };

  // ---- Loading / Error / Not Found states ----
  const isLoading = isCoursesLoading || isModulesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isCoursesError || isModulesError) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Failed to load course data.</p>
        <Button
          variant="outline"
          onClick={() => {
            void refetchCourses();
            void refetchModules();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Course not found.</p>
        <Button variant="outline" asChild>
          <Link to="/my-courses">Back to My Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/my-courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Courses
      </Link>

      {/* Course details card */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSaveCourse)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">Title</Label>
              <Input
                id="course-title"
                placeholder="Course title"
                aria-describedby={errors.title ? 'course-title-error' : undefined}
                {...register('title')}
              />
              {errors.title && (
                <p id="course-title-error" className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-description">Description</Label>
              <Textarea
                id="course-description"
                placeholder="Course description"
                rows={4}
                aria-describedby={errors.description ? 'course-description-error' : undefined}
                {...register('description')}
              />
              {errors.description && (
                <p id="course-description-error" className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateCourse.isPending}>
                {updateCourse.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setDeleteCourseOpen(true)}
              >
                Delete Course
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Modules section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Modules</h2>
          <Button variant="outline" onClick={handleAddModule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>

        {modules && modules.length === 0 && (
          <div className="text-center py-8 border rounded-lg">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No modules yet. Add your first module.</p>
          </div>
        )}

        {modules && modules.length > 0 && (
          <Accordion type="multiple" className="border rounded-lg divide-y">
            {[...modules].sort((a, b) => a.orderIndex - b.orderIndex).map((mod) => (
              <AccordionItem key={mod.id} value={mod.id} className="px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="font-medium">{mod.title}</span>
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditModule(mod)}
                        aria-label={`Edit ${mod.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteModule(mod)}
                        aria-label={`Delete ${mod.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-2">
                  {mod.lessons.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">No lessons yet</p>
                  )}
                  {[...mod.lessons].sort((a, b) => a.orderIndex - b.orderIndex).map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lesson.title}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditLesson(lesson, mod.id)}
                          aria-label={`Edit ${lesson.title}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLesson(lesson, mod.id)}
                          aria-label={`Delete ${lesson.title}`}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleAddLesson(mod.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Lesson
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Delete course dialog */}
      <ConfirmDeleteDialog
        open={deleteCourseOpen}
        onOpenChange={setDeleteCourseOpen}
        itemType="course"
        itemName={course.title}
        onConfirm={onConfirmDeleteCourse}
        isPending={deleteCourse.isPending}
      />

      {/* Module form dialog */}
      <ModuleFormDialog
        open={moduleDialogOpen}
        onOpenChange={(open) => {
          setModuleDialogOpen(open);
          if (!open) setSelectedModule(null);
        }}
        mode={moduleDialogMode}
        defaultValues={selectedModule ? { title: selectedModule.title } : undefined}
        onSubmit={onModuleSubmit}
        isPending={createModule.isPending || updateModule.isPending}
      />

      {/* Delete module dialog */}
      <ConfirmDeleteDialog
        open={deleteModuleOpen}
        onOpenChange={(open) => {
          setDeleteModuleOpen(open);
          if (!open) setModuleToDelete(null);
        }}
        itemType="module"
        itemName={moduleToDelete?.title ?? ''}
        onConfirm={onConfirmDeleteModule}
        isPending={deleteModule.isPending}
      />

      {/* Lesson form dialog */}
      <LessonFormDialog
        open={lessonDialogOpen}
        onOpenChange={(open) => {
          setLessonDialogOpen(open);
          if (!open) {
            setSelectedLesson(null);
            setLessonModuleId('');
          }
        }}
        mode={lessonDialogMode}
        defaultValues={
          selectedLesson ? { title: selectedLesson.title, content: selectedLesson.content } : undefined
        }
        onSubmit={onLessonSubmit}
        isPending={createLesson.isPending || updateLesson.isPending}
      />

      {/* Delete lesson dialog */}
      <ConfirmDeleteDialog
        open={deleteLessonOpen}
        onOpenChange={(open) => {
          setDeleteLessonOpen(open);
          if (!open) setLessonToDelete(null);
        }}
        itemType="lesson"
        itemName={lessonToDelete?.lesson.title ?? ''}
        onConfirm={onConfirmDeleteLesson}
        isPending={deleteLesson.isPending}
      />
    </div>
  );
}
