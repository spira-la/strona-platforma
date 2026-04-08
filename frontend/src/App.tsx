import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { CMSProvider } from '@/contexts/CMSContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout';

// Eagerly loaded pages
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';

// Lazy-loaded pages (code-split per route)
const About = lazy(() => import('@/pages/About'));
const HowIWork = lazy(() => import('@/pages/HowIWork'));
const Services = lazy(() => import('@/pages/Services'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const Contact = lazy(() => import('@/pages/Contact'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));

// Feature-flagged pages — lazy only when flags are active
const Webinars = lazy(() => import('@/pages/Webinars'));
const AudioCourses = lazy(() => import('@/pages/AudioCourses'));
const Ebooks = lazy(() => import('@/pages/Ebooks'));

// Coach pages — lazy-loaded, protected by CoachProtectedRoute
const CoachProtectedRoute = lazy(() => import('@/components/coach/CoachProtectedRoute'));
const CoachDashboard = lazy(() => import('@/pages/coach/Dashboard'));
const CoachProfile = lazy(() => import('@/pages/coach/Profile'));
const CoachSessions = lazy(() => import('@/pages/coach/Sessions'));
const CoachAvailability = lazy(() => import('@/pages/coach/Availability'));
const CoachServices = lazy(() => import('@/pages/coach/Services'));
const CoachBlog = lazy(() => import('@/pages/coach/Blog'));
const CoachBlogEditor = lazy(() => import('@/pages/coach/BlogEditor'));
const CoachNewsletter = lazy(() => import('@/pages/coach/Newsletter'));
const CoachInvoices = lazy(() => import('@/pages/coach/Invoices'));

// Admin pages — lazy-loaded, protected by AdminProtectedRoute
const AdminProtectedRoute = lazy(() => import('@/components/admin/AdminProtectedRoute'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminSessions = lazy(() => import('@/pages/admin/Sessions'));
const AdminAvailability = lazy(() => import('@/pages/admin/Availability'));
const AdminServices = lazy(() => import('@/pages/admin/Services'));
const AdminBlog = lazy(() => import('@/pages/admin/Blog'));
const AdminBlogEditor = lazy(() => import('@/pages/admin/BlogEditor'));
const AdminNewsletter = lazy(() => import('@/pages/admin/Newsletter'));
const AdminInvoices = lazy(() => import('@/pages/admin/Invoices'));
const AdminCoupons = lazy(() => import('@/pages/admin/Coupons'));
const AdminSEO = lazy(() => import('@/pages/admin/SEO'));
const AdminCategories = lazy(() => import('@/pages/admin/Categories'));
const AdminLanguages = lazy(() => import('@/pages/admin/Languages'));
const AdminContact = lazy(() => import('@/pages/admin/Contact'));
const AdminCoaches = lazy(() => import('@/pages/admin/Coaches'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/** Bridges React Router Outlet into the children-based Layout component. */
function PublicLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
      <p className="text-[#B8963E] text-lg">{t('common.loading')}</p>
    </div>
  );
}

function AppRoutes() {
  const showWebinars = useFeatureFlag('webinars');
  const showAudioCourses = useFeatureFlag('audioCourses');
  const showEbooks = useFeatureFlag('ebooks');

  return (
    <Routes>
      {/* Coach routes — use their own CoachLayout, no public Navbar/Footer */}
      <Route
        path="/coach/*"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <CoachProtectedRoute />
          </Suspense>
        }
      >
        <Route index element={<Suspense fallback={<LoadingFallback />}><CoachDashboard /></Suspense>} />
        <Route path="sessions" element={<Suspense fallback={<LoadingFallback />}><CoachSessions /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<LoadingFallback />}><CoachProfile /></Suspense>} />
        <Route path="availability" element={<Suspense fallback={<LoadingFallback />}><CoachAvailability /></Suspense>} />
        <Route path="services" element={<Suspense fallback={<LoadingFallback />}><CoachServices /></Suspense>} />
        <Route path="blog" element={<Suspense fallback={<LoadingFallback />}><CoachBlog /></Suspense>} />
        <Route path="blog/new" element={<Suspense fallback={<LoadingFallback />}><CoachBlogEditor /></Suspense>} />
        <Route path="blog/:id/edit" element={<Suspense fallback={<LoadingFallback />}><CoachBlogEditor /></Suspense>} />
        <Route path="newsletter" element={<Suspense fallback={<LoadingFallback />}><CoachNewsletter /></Suspense>} />
        <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><CoachInvoices /></Suspense>} />
      </Route>

      {/* Admin routes — use their own AdminLayout, no public Navbar/Footer */}
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminProtectedRoute />
          </Suspense>
        }
      >
        <Route index element={<Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>} />
        <Route path="sessions" element={<Suspense fallback={<LoadingFallback />}><AdminSessions /></Suspense>} />
        <Route path="availability" element={<Suspense fallback={<LoadingFallback />}><AdminAvailability /></Suspense>} />
        <Route path="services" element={<Suspense fallback={<LoadingFallback />}><AdminServices /></Suspense>} />
        <Route path="blog" element={<Suspense fallback={<LoadingFallback />}><AdminBlog /></Suspense>} />
        <Route path="blog/new" element={<Suspense fallback={<LoadingFallback />}><AdminBlogEditor /></Suspense>} />
        <Route path="blog/:id/edit" element={<Suspense fallback={<LoadingFallback />}><AdminBlogEditor /></Suspense>} />
        <Route path="newsletter" element={<Suspense fallback={<LoadingFallback />}><AdminNewsletter /></Suspense>} />
        <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><AdminInvoices /></Suspense>} />
        <Route path="coupons" element={<Suspense fallback={<LoadingFallback />}><AdminCoupons /></Suspense>} />
        <Route path="seo" element={<Suspense fallback={<LoadingFallback />}><AdminSEO /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<LoadingFallback />}><AdminCategories /></Suspense>} />
        <Route path="languages" element={<Suspense fallback={<LoadingFallback />}><AdminLanguages /></Suspense>} />
        <Route path="contact" element={<Suspense fallback={<LoadingFallback />}><AdminContact /></Suspense>} />
        <Route path="coaches" element={<Suspense fallback={<LoadingFallback />}><AdminCoaches /></Suspense>} />
      </Route>

      {/* Public routes — wrapped in the public Layout (Navbar, Footer, CMS toolbar) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/o-mnie" element={<Suspense fallback={<LoadingFallback />}><About /></Suspense>} />
        <Route path="/jak-pracuje" element={<Suspense fallback={<LoadingFallback />}><HowIWork /></Suspense>} />
        <Route path="/uslugi" element={<Suspense fallback={<LoadingFallback />}><Services /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<LoadingFallback />}><BlogPost /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<LoadingFallback />}><Blog /></Suspense>} />
        <Route path="/kontakt" element={<Suspense fallback={<LoadingFallback />}><Contact /></Suspense>} />
        <Route path="/auth/callback" element={<Suspense fallback={<LoadingFallback />}><AuthCallback /></Suspense>} />
        <Route path="/potwierdzenie" element={<Suspense fallback={<LoadingFallback />}><Confirmation /></Suspense>} />

        {/* Feature-flagged routes — hidden until flags are enabled */}
        {showWebinars && (
          <Route path="/webinary" element={<Suspense fallback={<LoadingFallback />}><Webinars /></Suspense>} />
        )}
        {showAudioCourses && (
          <Route path="/audio" element={<Suspense fallback={<LoadingFallback />}><AudioCourses /></Suspense>} />
        )}
        {showEbooks && (
          <Route path="/ebooki" element={<Suspense fallback={<LoadingFallback />}><Ebooks /></Suspense>} />
        )}

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CMSProvider>
              <AppRoutes />
            </CMSProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
