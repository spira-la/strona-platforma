/**
 * MyWebinars Page
 *
 * Displays user's purchased/registered webinars with tabs for:
 * - Upcoming: Scheduled and live sessions with Join button
 * - Recordings: Past sessions with available recordings
 *
 * Uses useMyWebinarRegistrations hook to fetch user's registrations
 * and enriches them with webinar and session details.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, Play, Calendar, Clock, Loader2, Trophy, History, Plus } from 'lucide-react';
import { motion } from 'motion/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/contexts/ThemeContext';

import { useAuth } from '@/contexts/AuthContext';
import { useMyWebinarRegistrations } from '@/hooks/useWebinarPurchase';
import { webinarsClient } from '@/clients/WebinarsClient';
import { webinarSessionsClient } from '@/clients/WebinarSessionsClient';
import { fadeInUp, staggerContainer } from '@/lib/motionVariants';
import leaftFull from '@/assets/leaftFull.png';
import leafUp from '@/assets/leafUp.png';

import type {
  WebinarProduct,
  WebinarSession,
  WebinarRegistration,
} from '@/domain/products/models/webinar.model';

// ============================================
// Types
// ============================================

interface EnrichedRegistration extends WebinarRegistration {
  webinar?: WebinarProduct;
  session?: WebinarSession;
}

// ============================================
// Component
// ============================================

export default function MyWebinars() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const { registrations, isLoading } = useMyWebinarRegistrations();

  const [enrichedRegistrations, setEnrichedRegistrations] = useState<EnrichedRegistration[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Fetch webinar and session details for each registration
  useEffect(() => {
    const fetchDetails = async () => {
      if (!registrations.length) {
        setEnrichedRegistrations([]);
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      const enriched = await Promise.all(
        registrations.map(async (reg) => {
          try {
            const [webinar, session] = await Promise.all([
              webinarsClient.getWebinarById(reg.webinarId),
              webinarSessionsClient.getSessionById(reg.sessionId),
            ]);
            return { ...reg, webinar: webinar || undefined, session: session || undefined };
          } catch {
            return reg;
          }
        })
      );
      setEnrichedRegistrations(enriched);
      setLoadingDetails(false);
    };

    if (!isLoading) {
      fetchDetails();
    }
  }, [registrations, isLoading]);

  // Separate upcoming and past sessions based on actual date/time
  const now = new Date();

  const upcoming = enrichedRegistrations.filter((r) => {
    if (!r.session) return false;
    // Calculate end time: scheduledAt + duration
    const startTime = new Date(r.session.scheduledAt).getTime();
    const durationMs = (r.webinar?.duration || 60) * 60 * 1000;
    const endTime = startTime + durationMs;
    // Show in upcoming if end time hasn't passed yet or is live
    return r.session.status === 'live' || endTime > now.getTime();
  });

  const pastSessions = enrichedRegistrations.filter((r) => {
    if (!r.session) return false;
    // Calculate end time: scheduledAt + duration
    const startTime = new Date(r.session.scheduledAt).getTime();
    const durationMs = (r.webinar?.duration || 60) * 60 * 1000;
    const endTime = startTime + durationMs;
    // Show in past if end time has passed and not live
    return r.session.status !== 'live' && endTime <= now.getTime();
  });

  // Format date with localization
  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get cover image URL with fallback
  const getCoverUrl = (webinar?: WebinarProduct): string => {
    if (!webinar) return '/placeholder.jpg';
    return webinar.coverUrls?.thumbnail || webinar.coverUrl || '/placeholder.jpg';
  };

  const totalItems = enrichedRegistrations.length;

  // Decorative leaves (both themes, dimmed in dark)
  const DecorativeLeaves = () => (
    <>
      <motion.img
        src={leaftFull}
        alt=""
        aria-hidden="true"
        className="absolute top-0 right-0 w-[clamp(16rem,32vw,28rem)] pointer-events-none select-none"
        initial={{ opacity: 0, x: 80, y: -40 }}
        animate={{ opacity: isDark ? 0.18 : 1, x: 0, y: 0 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.img
        src={leafUp}
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[clamp(14rem,28vw,24rem)] pointer-events-none select-none"
        initial={{ opacity: 0, x: -80, y: 40 }}
        animate={{ opacity: isDark ? 0.14 : 0.85, x: 0, y: 0 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
      />
    </>
  );

  // Loading state
  if (isLoading || loadingDetails || authLoading) {
    return (
      <div
        className={`min-h-screen relative overflow-hidden bg-gradient-to-b ${isDark ? 'from-[#091714]/80 via-[#0d1f1c]/60 to-[#0d1f1c]/70' : 'from-[#eaf9f0]/30 via-white to-[#eaf9f0]/50'}`}
      >
        <DecorativeLeaves />
        <div className="min-h-screen flex flex-col relative z-10">
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
            <div className="max-w-6xl mx-auto">
              <Skeleton className={`h-10 w-64 mb-2 ${isDark ? 'bg-[#1a352f]/50' : 'bg-[#285f59]/10'}`} />
              <Skeleton className={`h-6 w-96 mb-8 ${isDark ? 'bg-[#1a352f]/50' : 'bg-[#285f59]/10'}`} />
              <div className="flex items-center justify-center py-16">
                <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-400' : 'text-[#285f59]'}`} />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div
        className={`min-h-screen relative overflow-hidden bg-gradient-to-b ${isDark ? 'from-[#091714]/80 via-[#0d1f1c]/60 to-[#0d1f1c]/70' : 'from-[#eaf9f0]/30 via-white to-[#eaf9f0]/50'}`}
      >
        <DecorativeLeaves />
        <div className="min-h-screen flex flex-col relative z-10">
          <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
            <Card className={`max-w-lg backdrop-blur-md ${isDark ? 'bg-[#0d1f1c]/60 border-[#5eb8a8]/30' : 'bg-white shadow-lg border-[#285f59]/15'}`}>
              <CardContent className="p-8 text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a7a6f]/20' : 'bg-[#eaf9f0]'}`}>
                  <Video className={`h-8 w-8 ${isDark ? 'text-[#5eb8a8]' : 'text-[#bca151]'}`} />
                </div>
                <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#285f59]'}`}>
                  {t('auth.loginRequired', 'Login Required')}
                </h1>
                <p className={`mb-6 ${isDark ? 'text-[#e8f5f0]' : 'text-[#629a8d]'}`}>
                  {t('auth.loginToView', 'Please log in to view your webinars')}
                </p>
                <Button
                  onClick={() => navigate('/register?redirect=/my-webinars')}
                  className={isDark ? 'bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f]' : 'bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2d6b63] hover:to-[#4d7e72] text-white'}
                >
                  {t('auth.login', 'Log In')}
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Empty state - no webinars
  if (totalItems === 0) {
    return (
      <div
        className={`min-h-screen relative overflow-hidden bg-gradient-to-b ${isDark ? 'from-[#091714]/80 via-[#0d1f1c]/60 to-[#0d1f1c]/70' : 'from-[#eaf9f0]/30 via-white to-[#eaf9f0]/50'}`}
      >
        <DecorativeLeaves />
        <div className="min-h-screen flex flex-col relative z-10">
          <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
            <Card className={`max-w-lg backdrop-blur-md ${isDark ? 'bg-[#0d1f1c]/60 border-[#5eb8a8]/30' : 'bg-white shadow-lg border-[#285f59]/15'}`}>
              <CardContent className="p-8 text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a7a6f]/20' : 'bg-[#eaf9f0]'}`}>
                  <Video className={`h-8 w-8 ${isDark ? 'text-[#5eb8a8]' : 'text-[#bca151]'}`} />
                </div>
                <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#285f59]'}`}>
                  {t('webinars.myWebinars.noWebinars')}
                </h1>
                <p className={`mb-6 ${isDark ? 'text-[#e8f5f0]' : 'text-[#629a8d]'}`}>
                  {t(
                    'webinars.myWebinars.exploreText',
                    'Explore our live webinars and register for upcoming sessions.'
                  )}
                </p>
                <Button
                  onClick={() => navigate('/webinars')}
                  className={isDark ? 'bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f]' : 'bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2d6b63] hover:to-[#4d7e72] text-white'}
                >
                  {t('webinars.explore', 'Explore Webinars')}
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Main content with webinars
  return (
    <div
      className={`min-h-screen relative overflow-hidden bg-gradient-to-b ${isDark ? 'from-[#091714]/80 via-[#0d1f1c]/60 to-[#0d1f1c]/70' : 'from-[#eaf9f0]/30 via-white to-[#eaf9f0]/50'}`}
    >
      <DecorativeLeaves />
      <div className="min-h-screen flex flex-col relative z-10">
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <motion.div
            className="max-w-6xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#285f59]'}`}>
                    {t('webinars.myWebinars.title')}
                  </h1>
                  <p className={isDark ? 'text-[#e8f5f0]/80' : 'text-[#629a8d]'}>
                    {t('webinars.subtitle', 'Join interactive live sessions with our experts')}
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/webinars')}
                  className={isDark ? 'bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f] text-white' : 'bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2d6b63] hover:to-[#4d7e72] text-white shadow-md'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('webinars.explore', 'Explore Webinars')}
                </Button>
              </div>
            </motion.div>

            {/* Upcoming Webinars */}
            <motion.section variants={fadeInUp} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#2a7a6f]/20' : 'bg-[#eaf9f0]'}`}>
                  <Video className={`h-6 w-6 ${isDark ? 'text-[#5eb8a8]' : 'text-[#bca151]'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#285f59]'}`}>
                  {t('webinars.myWebinars.upcoming')} ({upcoming.length})
                </h2>
              </div>

              {upcoming.length === 0 ? (
                <Card className={isDark ? 'bg-[#0d1f1c]/40 border-[#243f39]/30' : 'bg-white border-[#285f59]/10 shadow-sm'}>
                  <CardContent className={`p-6 text-center ${isDark ? 'text-[#e8f5f0]/60' : 'text-[#629a8d]'}`}>
                    {t('webinars.noUpcoming')}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcoming.map((reg) => (
                    <Card
                      key={reg.id}
                      className={`group hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden ${isDark ? 'hover:shadow-[#5eb8a8]/20 border-[#243f39]/30 bg-[#0d1f1c]/40 hover:bg-[#1a352f]/50 hover:border-[#5eb8a8]/40' : 'hover:shadow-lg hover:shadow-[#285f59]/15 border-[#285f59]/10 bg-white shadow-sm hover:bg-[#eaf9f0]/30 hover:border-[#285f59]/25'}`}
                    >
                      {/* Cover Image */}
                      <div className="relative w-full h-40">
                        <img
                          src={getCoverUrl(reg.webinar)}
                          alt={reg.webinar?.name || 'Webinar'}
                          className="w-full h-full object-cover"
                        />
                        {reg.session?.status === 'live' && (
                          <Badge className="absolute top-2 left-2 bg-red-600 text-white border-0 animate-pulse">
                            {t('webinars.live')}
                          </Badge>
                        )}
                        {/* Giveaway winner badge */}
                        {reg.session?.giveawayWinners?.some(w => w.odantzIdFirebase === currentUser?.uid) && (
                          <Badge className={`absolute top-2 right-2 ${isDark ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-[#bca151]/15 text-[#bca151] border-[#bca151]/30'}`}>
                            <Trophy className="w-3 h-3 mr-1" />
                            {t(`webinars.giveaway.${`place${reg.session.giveawayWinners.find(w => w.odantzIdFirebase === currentUser?.uid)?.place || 1}` as 'place1' | 'place2' | 'place3'}`)}
                          </Badge>
                        )}
                      </div>

                      <CardHeader className="pb-2">
                        <CardTitle className={`text-lg transition-colors duration-300 line-clamp-2 ${isDark ? 'text-white group-hover:text-[#a3cec3]' : 'text-[#285f59] group-hover:text-[#47695b]'}`}>
                          {reg.webinar?.name || t('webinars.title')}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Date */}
                        <div className={`flex items-center gap-2 ${isDark ? 'text-[#e8f5f0]' : 'text-[#47695b]'}`}>
                          <Calendar className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-[#5eb8a8]' : 'text-[#bca151]'}`} />
                          <span className="text-sm truncate">{reg.session && formatDate(reg.session.scheduledAt)}</span>
                        </div>

                        {/* Duration */}
                        {reg.webinar?.duration && (
                          <div className={`flex items-center gap-2 ${isDark ? 'text-[#e8f5f0]' : 'text-[#47695b]'}`}>
                            <Clock className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-[#5eb8a8]' : 'text-[#bca151]'}`} />
                            <span className="text-sm">{t('webinars.duration', { duration: reg.webinar.duration })}</span>
                          </div>
                        )}

                        {/* Host */}
                        {reg.webinar?.host?.name && (
                          <p className={`text-sm ${isDark ? 'text-[#e8f5f0]/60' : 'text-[#629a8d]'}`}>
                            {t('webinars.host')}: {reg.webinar.host.name}
                          </p>
                        )}

                        {/* Join Button */}
                        <Link to={`/webinar-room/${reg.session?.id}`} className="block pt-2">
                          <Button className={`w-full text-white ${isDark ? 'bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f]' : 'bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2d6b63] hover:to-[#4d7e72]'}`}>
                            <Play className="w-4 h-4 mr-2" />
                            {t('webinars.joinNow')}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Past Webinars */}
            <motion.section variants={fadeInUp}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-500/20' : 'bg-[#eaf9f0]'}`}>
                  <History className={`h-6 w-6 ${isDark ? 'text-slate-400' : 'text-[#629a8d]'}`} />
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#285f59]'}`}>
                  {t('webinars.myWebinars.past', 'Past')} ({pastSessions.length})
                </h2>
              </div>

              {pastSessions.length === 0 ? (
                <Card className={isDark ? 'bg-[#0d1f1c]/40 border-[#1a352f]/30' : 'bg-white border-[#285f59]/10 shadow-sm'}>
                  <CardContent className={`p-6 text-center ${isDark ? 'text-[#e8f5f0]/60' : 'text-[#629a8d]'}`}>
                    {t('webinars.myWebinars.noPast', 'No past sessions yet.')}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastSessions.map((reg) => {
                    return (
                      <Card
                        key={reg.id}
                        className={`group hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden opacity-80 hover:opacity-100 ${isDark ? 'hover:shadow-[#5eb8a8]/20 border-[#1a352f]/30 bg-[#0d1f1c]/40 hover:bg-[#1a352f]/50 hover:border-[#243f39]/40' : 'hover:shadow-lg hover:shadow-[#285f59]/10 border-[#285f59]/10 bg-white shadow-sm hover:bg-[#eaf9f0]/20 hover:border-[#285f59]/20'}`}
                      >
                        {/* Cover Image */}
                        <div className="relative w-full h-40">
                          <img
                            src={getCoverUrl(reg.webinar)}
                            alt={reg.webinar?.name || 'Webinar'}
                            className="w-full h-full object-cover"
                          />
                          {reg.session?.giveawayWinners?.some(w => w.odantzIdFirebase === currentUser?.uid) && (
                            <Badge className={`absolute top-2 right-2 ${isDark ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-[#bca151]/15 text-[#bca151] border-[#bca151]/30'}`}>
                              <Trophy className="w-3 h-3 mr-1" />
                              {t(`webinars.giveaway.${`place${reg.session.giveawayWinners.find(w => w.odantzIdFirebase === currentUser?.uid)?.place || 1}` as 'place1' | 'place2' | 'place3'}`)}
                            </Badge>
                          )}
                        </div>

                        <CardHeader className="pb-2">
                          <CardTitle className={`text-lg transition-colors duration-300 line-clamp-2 ${isDark ? 'text-white/80 group-hover:text-white' : 'text-[#285f59]/70 group-hover:text-[#285f59]'}`}>
                            {reg.webinar?.name || t('webinars.title')}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* Date */}
                          <div className={`flex items-center gap-2 ${isDark ? 'text-[#e8f5f0]/70' : 'text-[#629a8d]'}`}>
                            <Calendar className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-[#629a8d]'}`} />
                            <span className="text-sm truncate">{reg.session && formatDate(reg.session.scheduledAt)}</span>
                          </div>

                          {/* Duration */}
                          {reg.webinar?.duration && (
                            <div className={`flex items-center gap-2 ${isDark ? 'text-[#e8f5f0]/70' : 'text-[#629a8d]'}`}>
                              <Clock className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-[#629a8d]'}`} />
                              <span className="text-sm">{t('webinars.duration', { duration: reg.webinar.duration })}</span>
                            </div>
                          )}

                          {/* Host */}
                          {reg.webinar?.host?.name && (
                            <p className={`text-sm ${isDark ? 'text-[#e8f5f0]/50' : 'text-[#629a8d]/70'}`}>
                              {t('webinars.host')}: {reg.webinar.host.name}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.section>
          </motion.div>
        </main>

      </div>
    </div>
  );
}
