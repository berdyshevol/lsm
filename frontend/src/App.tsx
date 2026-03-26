import { Routes, Route, Navigate } from 'react-router';
import { useAuth, AuthProvider, type User } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LessonLayout } from '@/components/layout/LessonLayout';
import { CourseDetailLayout } from '@/components/layout/CourseDetailLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { MyLearningPage } from '@/pages/MyLearningPage';
import { CourseCatalogPage } from '@/pages/CourseCatalogPage';
import { CourseDetailPage } from '@/pages/CourseDetailPage';
import { LessonViewPage } from '@/pages/LessonViewPage';
import { MyCoursesPage } from '@/pages/MyCoursesPage';
import { CourseEditorPage } from '@/pages/CourseEditorPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { AdminCoursesPage } from '@/pages/AdminCoursesPage';

const defaultLanding: Record<User['role'], string> = {
  Student: '/my-learning',
  Instructor: '/my-courses',
  Admin: '/admin/users',
};

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function ProtectedLessonRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <LessonLayout />;
}

function ProtectedCourseDetailRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <CourseDetailLayout />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={defaultLanding[user.role]} replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={defaultLanding[user.role]} replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/my-learning" element={<MyLearningPage />} />
        <Route path="/my-courses" element={<MyCoursesPage />} />
        <Route path="/my-courses/:id/edit" element={<CourseEditorPage />} />
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/courses" element={<AdminCoursesPage />} />
      </Route>
      <Route element={<ProtectedCourseDetailRoute />}>
        <Route path="/courses/:id" element={<CourseDetailPage />} />
      </Route>
      <Route element={<ProtectedLessonRoute />}>
        <Route path="/courses/:id/lessons/:lessonId" element={<LessonViewPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
