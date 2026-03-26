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
import { Label } from '@/components/ui/label';

const moduleSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title too long'),
});

type FormData = z.infer<typeof moduleSchema>;

interface ModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  defaultValues?: { title: string };
  onSubmit: (data: { title: string }) => void;
  isPending: boolean;
}

export function ModuleFormDialog({
  open,
  onOpenChange,
  mode,
  defaultValues,
  onSubmit,
  isPending,
}: ModuleFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(moduleSchema),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Module' : 'Edit Module'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new module.' : 'Update module details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module-title">Title</Label>
            <Input
              id="module-title"
              placeholder="Module title"
              aria-describedby={errors.title ? 'module-title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="module-title-error" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === 'create' ? 'Add Module' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
