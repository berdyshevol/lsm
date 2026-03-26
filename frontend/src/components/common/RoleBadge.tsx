import { Badge } from '@/components/ui/badge';
import type { User } from '@/hooks/useAuth';

const roleStyles: Record<User['role'], string> = {
  Student: 'bg-blue-100 text-blue-700',
  Instructor: 'bg-green-100 text-green-700',
  Admin: 'bg-red-100 text-red-700',
};

export function RoleBadge({ role }: { role: User['role'] }) {
  return (
    <Badge variant="secondary" className={roleStyles[role]}>
      {role}
    </Badge>
  );
}
