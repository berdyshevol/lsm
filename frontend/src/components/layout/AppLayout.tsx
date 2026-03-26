import { Outlet } from 'react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Breadcrumbs } from './Breadcrumbs';

export function AppLayout() {
  return (
    <SidebarProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
      >
        Skip to content
      </a>
      <AppSidebar />
      <SidebarInset>
        <main id="main" className="flex-1 p-6">
          <div className="mx-auto max-w-5xl">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
