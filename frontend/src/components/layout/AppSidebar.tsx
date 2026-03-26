import { Link, useLocation } from 'react-router';
import {
  BookCopy,
  BookOpen,
  ChevronsUpDown,
  Library,
  LogOut,
  Search,
  Users,
  UserRoundCog,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, type User } from '@/hooks/useAuth';
import { RoleBadge } from '@/components/common/RoleBadge';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navByRole: Record<User['role'], NavItem[]> = {
  Student: [
    { title: 'My Learning', url: '/my-learning', icon: BookOpen },
    { title: 'Browse Courses', url: '/courses', icon: Search },
  ],
  Instructor: [
    { title: 'My Courses', url: '/my-courses', icon: BookCopy },
    { title: 'Browse Courses', url: '/courses', icon: Search },
  ],
  Admin: [
    { title: 'Users', url: '/admin/users', icon: Users },
    { title: 'All Courses', url: '/admin/courses', icon: Library },
  ],
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = navByRole[user.role];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="font-bold text-lg">
              LSM
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === item.url ||
                      location.pathname.startsWith(item.url + '/')
                    }
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <div className="flex flex-1 items-center gap-2 text-left text-sm">
                    <span className="truncate font-medium">{user.name}</span>
                    <RoleBadge role={user.role} />
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={() => void logout()}>
                  <UserRoundCog />
                  Switch Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void logout()}>
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
