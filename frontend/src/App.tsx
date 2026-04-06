import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
const Contact = lazy(() => import('@/pages/Contact'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));

// Feature-flagged pages — lazy only when flags are active
const Webinars = lazy(() => import('@/pages/Webinars'));
const AudioCourses = lazy(() => import('@/pages/AudioCourses'));
const Ebooks = lazy(() => import('@/pages/Ebooks'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

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
    <Layout>
      <Routes>
        {/* Active routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/o-mnie"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="/jak-pracuje"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <HowIWork />
            </Suspense>
          }
        />
        <Route
          path="/uslugi"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Services />
            </Suspense>
          }
        />
        <Route
          path="/blog"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Blog />
            </Suspense>
          }
        />
        <Route
          path="/kontakt"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Contact />
            </Suspense>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AuthCallback />
            </Suspense>
          }
        />
        <Route
          path="/potwierdzenie"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Confirmation />
            </Suspense>
          }
        />

        {/* Feature-flagged routes — hidden until flags are enabled */}
        {showWebinars && (
          <Route
            path="/webinary"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Webinars />
              </Suspense>
            }
          />
        )}
        {showAudioCourses && (
          <Route
            path="/audio"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AudioCourses />
              </Suspense>
            }
          />
        )}
        {showEbooks && (
          <Route
            path="/ebooki"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Ebooks />
              </Suspense>
            }
          />
        )}

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CMSProvider>
            <AppRoutes />
          </CMSProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
