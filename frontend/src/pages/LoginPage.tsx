import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { DemoCredentials } from '@/components/common/DemoCredentials';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const [showColdStart, setShowColdStart] = useState(false);
  const coldStartToastId = useRef<string | number | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setShowColdStart(false);
      return;
    }
    const timer = setTimeout(() => setShowColdStart(true), 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: LoginFormData) => {
    const submitTimer = setTimeout(() => {
      coldStartToastId.current = toast.info(
        'Server is waking up (free tier hosting) — this takes ~30 seconds on first visit',
      );
    }, 3000);

    try {
      await login(data.email, data.password);
    } catch (error: unknown) {
      const message = (error as { message?: string | string[] })?.message || 'Invalid credentials';
      toast.error(Array.isArray(message) ? message[0] : message, { duration: 5000 });
    } finally {
      clearTimeout(submitTimer);
      if (coldStartToastId.current !== null) {
        toast.dismiss(coldStartToastId.current);
        coldStartToastId.current = null;
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <DemoCredentials disabled={isSubmitting} />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
      {showColdStart && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" />
          <span>Server is waking up (free tier hosting) — this takes ~30 seconds on first visit</span>
        </div>
      )}
      </div>
    </div>
  );
}
