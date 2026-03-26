import { useState } from 'react';
import { GraduationCap, BookOpen, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

const demoAccounts = [
  {
    role: 'Student' as const,
    email: 'student@lms.com',
    icon: GraduationCap,
  },
  {
    role: 'Instructor' as const,
    email: 'instructor@lms.com',
    icon: BookOpen,
  },
  {
    role: 'Admin' as const,
    email: 'admin@lms.com',
    icon: Shield,
  },
];

interface DemoCredentialsProps {
  disabled?: boolean;
}

export function DemoCredentials({ disabled = false }: DemoCredentialsProps) {
  const { login } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleDemoLogin = async (email: string, role: string) => {
    setLoadingRole(role);
    try {
      await login(email, 'password123');
    } catch (error: unknown) {
      const message = (error as { message?: string | string[] })?.message || 'Login failed';
      toast.error(Array.isArray(message) ? message[0] : message, { duration: 5000 });
      setLoadingRole(null);
    }
  };

  return (
    <div className="space-y-4">
      <Separator />
      <p className="text-sm font-medium text-muted-foreground">Demo Accounts</p>
      <div className="space-y-2">
        {demoAccounts.map(({ role, email, icon: Icon }) => (
          <Button
            key={role}
            variant="outline"
            className="w-full justify-start gap-3"
            disabled={disabled || loadingRole !== null}
            onClick={() => handleDemoLogin(email, role)}
            aria-label={`Login as ${role}`}
          >
            {loadingRole === role ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            <span className="flex-1 text-left">{email}</span>
            <span className="text-xs text-muted-foreground">{role}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
