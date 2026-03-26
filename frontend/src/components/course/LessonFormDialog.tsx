import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const lessonSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().trim().min(1, 'Content is required').max(50000, 'Content too long'),
});

type FormData = z.infer<typeof lessonSchema>;

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  defaultValues?: { title: string; content: string };
  onSubmit: (data: { title: string; content: string }) => void;
  isPending: boolean;
}

export function LessonFormDialog({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onSubmit,
  isPending,
}: LessonFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(lessonSchema),
    values: mode === 'edit' ? defaultValues : undefined,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Lesson' : 'Edit Lesson'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new lesson.' : 'Update lesson details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input
              id="lesson-title"
              placeholder="Lesson title"
              aria-describedby={errors.title ? 'lesson-title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="lesson-title-error" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-content">Content (Markdown)</Label>
            <Textarea
              id="lesson-content"
              placeholder="Lesson content in markdown..."
              rows={8}
              aria-describedby={errors.content ? 'lesson-content-error' : undefined}
              {...register('content')}
            />
            {errors.content && (
              <p id="lesson-content-error" className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === 'create' ? 'Add Lesson' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
