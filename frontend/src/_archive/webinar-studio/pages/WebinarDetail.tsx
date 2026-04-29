/**
 * WebinarDetail Page
 *
 * Detail page for viewing a webinar product with:
 * - Full-width vertical layout matching catalog page aesthetic
 * - Product hero with cover image and key info
 * - Fully expanded description (no scroll container)
 * - Speaker section with photo and bio
 * - Details + session selector
 * - Final CTA section
 * - Mobile floating purchase bar
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  ShoppingCart,
  Gift,
  Video,
  Play,
  User,
  Globe,
  Tag,
  CalendarDays,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { ResponsiveCover } from "@/components/ui/responsive-cover";
import { BackButton } from "@/components/ui/back-button";
import { webinarsClient, webinarSessionsClient } from "@/clients";
import { useWebinarPurchase, useMyWebinarRegistrations } from "@/hooks/useWebinarPurchase";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentLocale } from "@/hooks/useCurrentLocale";
import {
  SEOHead,
  BreadcrumbStructuredData,
  FAQStructuredData,
  DigitalProductStructuredData,
  DEFAULT_WEBINAR_FAQS,
} from "@/components/seo";
import { ProductNotFound } from "@/components/ProductNotFound";
import { trackPageView, trackProductClick, trackAddToCart } from "@/utils/analytics";
import { PaymentIcons } from "@/components/PaymentIcons";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "motion/react";
import leaftFull from "@/assets/leaftFull.png";
import leafUp from "@/assets/leafUp.png";
import type { WebinarProduct, WebinarSession } from "@/domain/products/models/webinar.model";

// ============================================
// Decorative Leaves (catalog pattern)
// ============================================

const DecorativeLeaves = ({ isDark }: { isDark: boolean }) => (
  <>
    <motion.img
      src={leaftFull}
      alt=""
      className="pointer-events-none absolute top-0 right-0 w-[clamp(16rem,32vw,28rem)] select-none blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isDark ? 0.12 : 0.45 }}
      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    />
    <motion.img
      src={leafUp}
      alt=""
      className="pointer-events-none absolute bottom-0 left-0 w-[clamp(14rem,28vw,24rem)] select-none blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isDark ? 0.10 : 0.40 }}
      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
    />
  </>
);

// ============================================
// Main Component
// ============================================

export default function WebinarDetail() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addItem, isItemInCart } = useCart();
  const { toast } = useToast();
  const { currentLocale } = useCurrentLocale();
  const { isDark } = useTheme();

  // Get the identifier (either slug or ID) - backend handles both
  const paramValue = params.slug || params.id;
  const id = paramValue;

  // State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Mobile sticky price bar - shows fixed bar until user scrolls to the CTA section
  const priceBarRef = useRef<HTMLDivElement>(null);
  const [showFixedPriceBar, setShowFixedPriceBar] = useState(true);

  // Sessions section ref for scroll-to functionality
  const sessionsSectionRef = useRef<HTMLDivElement>(null);

  // Show all sessions (collapsed by default, only next session visible)
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Simple price formatter
  const formatPrice = (price: number) => `${price.toFixed(2)} zł`;

  // Fetch webinar data
  const {
    data: webinar,
    isLoading: webinarLoading,
    error: webinarError,
  } = useQuery({
    queryKey: ["webinar", id],
    queryFn: () => webinarsClient.getWebinarById(id!),
    enabled: !!id,
    retry: false,
  });

  // Fetch sessions for this webinar
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: ["webinar-sessions", webinar?.id],
    queryFn: () => webinarSessionsClient.getSessionsForWebinar(webinar!.id),
    enabled: !!webinar?.id,
    retry: false,
  });

  // Get all user's registrations for this webinar
  const {
    registrations: myRegistrations = [],
    isLoading: registrationsLoading,
  } = useMyWebinarRegistrations();

  // Filter registrations for this webinar
  const webinarRegistrations = useMemo(() => {
    if (!webinar?.id || !Array.isArray(myRegistrations)) return [];
    return myRegistrations.filter((r) => r.webinarId === webinar.id);
  }, [myRegistrations, webinar?.id]);

  // Helper to check if user has access to a specific session
  const hasAccessToSession = useCallback((sessionId: string) => {
    return webinarRegistrations.some((r) => r.sessionId === sessionId);
  }, [webinarRegistrations]);

  // Check if user has access to the currently selected session
  const hasAccess = useMemo(() => {
    if (!selectedSessionId) return false;
    return hasAccessToSession(selectedSessionId);
  }, [selectedSessionId, hasAccessToSession]);

  const isFreeWebinar = !webinar?.basePrices?.pln || webinar.basePrices.pln === 0;

  // Get registration for selected session (if any)
  const registration = useMemo(() => {
    if (!selectedSessionId) return null;
    return webinarRegistrations.find((r) => r.sessionId === selectedSessionId) || null;
  }, [selectedSessionId, webinarRegistrations]);

  const isLoading = webinarLoading || sessionsLoading;
  const purchaseLoading = registrationsLoading;

  // Get sessions to display (upcoming + active sessions)
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    const durationMs = (webinar?.duration || 60) * 60 * 1000; // duration in ms
    return sessions
      .filter((s) => {
        // Never show cancelled or ended sessions
        if (s.status === "cancelled" || s.status === "ended") return false;

        // Always show if live
        if (s.status === "live") return true;

        // Show if status is stopped or planning (host may restart)
        if (s.status === "stopped" || s.status === "planning") return true;

        // Calculate end time: scheduledAt + duration
        const startTime = new Date(s.scheduledAt).getTime();
        const endTime = startTime + durationMs;
        // Show scheduled sessions if end time hasn't passed yet
        return s.status === "scheduled" && endTime > now.getTime();
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [sessions, webinar?.duration]);

  // Get next available session
  const nextSession = useMemo(() => {
    return upcomingSessions.find(
      (s) =>
        s.status === "live" ||
        (s.status === "scheduled" &&
          webinar &&
          webinar.capacity - (s.registeredCount || 0) > 0)
    );
  }, [upcomingSessions, webinar]);

  // Auto-select session ONLY if there's exactly one upcoming session
  useEffect(() => {
    if (upcomingSessions.length === 1 && !selectedSessionId) {
      setSelectedSessionId(upcomingSessions[0].id);
    }
  }, [upcomingSessions, selectedSessionId]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Track page view when webinar loads
  useEffect(() => {
    if (webinar) {
      trackPageView("Webinar Page", {
        product_id: webinar.id,
        product_name: webinar.name,
        product_type: "webinar",
        price: webinar.basePrices?.pln,
      });
      trackProductClick(webinar.id, webinar.name, "webinar", webinar.basePrices?.pln);
    }
  }, [webinar]);

  // Detect when the CTA section enters viewport to hide the mobile fixed bar
  useEffect(() => {
    const priceBar = priceBarRef.current;
    if (!priceBar || hasAccess || purchaseLoading) return;

    let observer: IntersectionObserver | null = null;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        ([entry]) => {
          setShowFixedPriceBar(!entry.isIntersecting);
        },
        {
          threshold: 0.1,
        }
      );

      observer.observe(priceBar);
    }, 300);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [webinar?.id, hasAccess, purchaseLoading]);

  // Format session date
  const formatSessionDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(currentLocale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format session time
  const formatSessionTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString(currentLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Error handling
  const getErrorType = () => {
    if (!id) return "noId";
    if (webinarError) {
      if (
        (webinarError as Error).message?.includes("not found") ||
        (webinarError as Error).message?.includes("No such document")
      ) {
        return "notFound";
      }
      return "general";
    }
    if (!webinar && !webinarLoading) return "notFound";
    return null;
  };

  const errorType = getErrorType();

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!webinar || !selectedSessionId) {
      toast({
        title: t("webinars.selectSession"),
        description: t("webinars.selectSessionDescription"),
        variant: "destructive",
      });
      return;
    }

    const session = sessions.find((s) => s.id === selectedSessionId);
    if (!session) return;

    // Check if this specific session is already in cart
    if (isItemInCart(webinar.id, "webinar", selectedSessionId)) {
      toast({
        title: t("cart.alreadyInCart"),
        description: `${webinar.name} ${t("cart.alreadyInCartDescription")}`,
        variant: "default",
        duration: 2000,
      });
      return;
    }

    // Track add to cart
    trackAddToCart(webinar.id, webinar.name, "webinar", webinar.basePrices?.pln || 0);

    // Add to cart with webinar metadata
    addItem({
      productId: webinar.id,
      productType: "webinar",
      name: webinar.name,
      price: webinar.basePrices?.pln || 0,
      currency: "pln",
      quantity: 1,
      description: webinar.description,
      coverUrl: webinar.coverUrls?.thumbnail || webinar.coverUrls?.small || webinar.coverUrl,
      metadata: {
        webinar: {
          webinarId: webinar.id,
          sessionId: selectedSessionId,
          scheduledAt: session.scheduledAt as string,
          hostId: webinar.host.id,
          hostName: webinar.host.name,
          capacity: webinar.capacity,
          registeredCount: session.registeredCount || 0,
        },
      },
    });

    toast({
      title: t("cart.addedToCart"),
      description: `${webinar.name} ${t("cart.addedToCartDescription")}`,
      duration: 3000,
    });

    navigate("/cart");
  }, [webinar, selectedSessionId, sessions, addItem, navigate, toast, t, isItemInCart]);

  // Handle add as gift
  const handleAddAsGift = useCallback(() => {
    if (!webinar || !selectedSessionId) {
      toast({
        title: t("webinars.selectSession"),
        description: t("webinars.selectSessionDescription"),
        variant: "destructive",
      });
      return;
    }

    const session = sessions.find((s) => s.id === selectedSessionId);
    if (!session) return;

    // Add to cart as gift
    addItem({
      productId: webinar.id,
      productType: "webinar",
      name: webinar.name,
      price: webinar.basePrices?.pln || 0,
      currency: "pln",
      quantity: 1,
      description: webinar.description,
      coverUrl: webinar.coverUrls?.thumbnail || webinar.coverUrls?.small || webinar.coverUrl,
      metadata: {
        webinar: {
          webinarId: webinar.id,
          sessionId: selectedSessionId,
          scheduledAt: session.scheduledAt as string,
          hostId: webinar.host.id,
          hostName: webinar.host.name,
          capacity: webinar.capacity,
          registeredCount: session.registeredCount || 0,
        },
        forceGift: hasAccess,
        gift: hasAccess
          ? undefined
          : {
              isGift: true,
              recipientEmail: "",
              recipientFirstName: "",
              recipientLastName: "",
              senderName: "",
              senderEmail: "",
              giftMessage: "",
            },
      },
    });

    toast({
      title: t("cart.gift.addedAsGift"),
      description: `${webinar.name} ${t("cart.gift.addedAsGiftDescription")}`,
      duration: 3000,
    });

    navigate("/cart");
  }, [webinar, selectedSessionId, sessions, hasAccess, addItem, navigate, toast, t]);

  // Handle join session
  const handleJoinSession = useCallback(
    (sessionId: string) => {
      navigate(`/webinar-room/${sessionId}`);
    },
    [navigate]
  );

  // Scroll to sessions section (for mobile floating bar)
  const scrollToSessions = useCallback(() => {
    sessionsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Error state - show not found page
  if (errorType && !isLoading) {
    return (
      <ProductNotFound
        type="general"
        title={t("notFound.webinar.title", "Webinar Not Found")}
        description={t(
          "notFound.webinar.description",
          "The webinar you're looking for doesn't exist or has been removed."
        )}
        browseLink="/#webinars"
        browseText={t("notFound.webinar.browse", "Browse Webinars")}
      />
    );
  }

  // Get host info
  const hostName = webinar?.host?.name || "";
  const hostAvatar = webinar?.host?.avatar;
  const hostBio = webinar?.host?.bio;

  // Get guest speakers
  const guestSpeakers = webinar?.guestSpeakers || [];

  // Get selected session details
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${isDark ? 'bg-[#0d1f1c]' : 'bg-[#eaf9f0]'}`}
    >
      <DecorativeLeaves isDark={isDark} />

      {/* SEO Meta Tags */}
      {webinar && (
        <>
          <SEOHead
            title={webinar.name}
            description={webinar.description?.substring(0, 160)}
            url={paramValue ? `/webinars/${paramValue}` : `/webinar/${id}`}
            type="product"
            image={webinar.coverUrls?.large || webinar.coverUrls?.original || webinar.coverUrl}
            author={hostName}
            price={webinar.basePrices?.pln}
            currency="PLN"
            keywords={[
              "webinar",
              "live session",
              webinar.category || "wellness",
              "online course",
              ...(webinar.tags || []),
            ]}
          />
          <DigitalProductStructuredData
            productType="webinar"
            name={webinar.name}
            description={webinar.description}
            image={webinar.coverUrls?.large || webinar.coverUrls?.original || webinar.coverUrl}
            price={webinar.basePrices?.pln || 0}
            currency="PLN"
            sku={webinar.slug || webinar.id}
            category={webinar.category}
            rating={webinar.rating}
            reviewCount={webinar.totalReviews}
            url={`https://be-wonder.me${paramValue ? `/webinars/${paramValue}` : `/webinar/${id}`}`}
            hostName={hostName}
            startDate={selectedSession?.scheduledAt ? new Date(selectedSession.scheduledAt).toISOString() : undefined}
          />
          <BreadcrumbStructuredData
            items={[
              { name: t("nav.home", "Home"), url: "/" },
              { name: t("nav.webinars", "Webinars"), url: "/#webinars" },
              {
                name: webinar.name,
                url: paramValue ? `/webinars/${paramValue}` : `/webinar/${id}`,
              },
            ]}
          />
          <FAQStructuredData faqs={webinar.faqs && webinar.faqs.length > 0 ? webinar.faqs : DEFAULT_WEBINAR_FAQS} />
        </>
      )}

      {/* Back Button */}
      <div className="px-6 md:px-12 lg:px-[120px] pt-10 md:pt-12">
        <BackButton
          toSection="webinars"
          className={`mb-0 ${isDark ? 'text-[#8cbcb0] hover:text-white hover:bg-[#5eb8a8]/10' : 'text-[#5A6E64] hover:text-[#1B3B30] hover:bg-[#E8F5E9]'}`}
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="px-6 md:px-12 lg:px-[120px] py-12">
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className={`w-full lg:w-[440px] aspect-[4/3] rounded-2xl animate-pulse flex-shrink-0 ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`} />
              <div className="flex-1 space-y-4">
                <div className={`h-4 w-32 animate-pulse rounded ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`} />
                <div className={`h-4 w-48 animate-pulse rounded ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`} />
                <div className={`h-10 w-3/4 animate-pulse rounded ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`} />
                <div className={`h-6 w-full animate-pulse rounded ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`} />
                <div className={`h-12 w-40 animate-pulse rounded-xl ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`} />
              </div>
            </div>
          </div>
        </div>
      ) : webinar ? (
        <>
          {/* ============================================ */}
          {/* SECTION 1: Product Hero                      */}
          {/* ============================================ */}
          <section className="px-6 md:px-12 lg:px-[120px] py-8 md:py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
              {/* Cover Image */}
              <div className="w-full lg:w-[440px] lg:flex-shrink-0">
                <ResponsiveCover
                  coverUrls={webinar.coverUrls}
                  coverUrl={webinar.coverUrl}
                  alt={webinar.name}
                  className="shadow-xl rounded-2xl"
                  aspectRatio="aspect-[4/3]"
                  enableLightbox
                  showZoomIcon
                  placeholder={
                    <div className={`w-full aspect-[4/3] bg-gradient-to-br rounded-2xl shadow-xl flex items-center justify-center border ${isDark ? 'from-[#5eb8a8]/20 to-[#285f59]/20 border-[#5eb8a8]/30' : 'from-[#1B5E4B]/10 to-[#285f59]/10 border-[#1B5E4B]/20'}`}>
                      <Video className={`h-12 w-12 ${isDark ? 'text-[#5eb8a8]/50' : 'text-[#1B5E4B]/30'}`} />
                    </div>
                  }
                />
              </div>

              {/* Hero Content */}
              <div className="flex-1 flex flex-col gap-4 lg:gap-5 lg:py-4">
                {/* Hosted By */}
                <p className={`font-inter text-[11px] uppercase tracking-[0.15em] font-semibold ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`}>
                  {t("webinars.hostedBy", "Hosted by")} {hostName}
                </p>

                {/* Title */}
                <h1 className={`font-playfair text-[24px] md:text-[28px] lg:text-[36px] font-bold leading-[1.15] ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                  {webinar.name}
                </h1>

                {/* Live badge */}
                {nextSession?.status === "live" && (
                  <Badge className="bg-red-600 text-white animate-pulse text-xs w-fit">
                    <Play className="w-3 h-3 mr-1" />
                    LIVE
                  </Badge>
                )}

                {/* Next session date */}
                {nextSession && (
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${isDark ? 'bg-[#162e29] hover:bg-[#1a3832]' : 'bg-[#E8F5E9] hover:bg-[#ddf0e3]'}`}
                    onClick={scrollToSessions}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#2a7a6f]' : 'bg-[#1B5E4B]'}`}>
                      <Calendar className="w-4 h-4" color="white" />
                    </div>
                    <p className={`font-inter text-[18px] md:text-[20px] font-bold ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                      {formatSessionDate(nextSession.scheduledAt)}
                      <span className={`ml-2 font-semibold ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>
                        {formatSessionTime(nextSession.scheduledAt)}
                      </span>
                    </p>
                    {upcomingSessions.length > 1 && (
                      <span className={`ml-auto font-inter text-[12px] font-medium ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`}>
                        +{upcomingSessions.length - 1} {t("webinars.moreDates", "more")}
                      </span>
                    )}
                  </div>
                )}

                {/* Price + CTA (only if no access) */}
                {!hasAccess && !purchaseLoading && (
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div>
                      {isFreeWebinar ? (
                        <span className="font-playfair text-[28px] font-bold text-green-600">
                          {t("webinars.free")}
                        </span>
                      ) : (
                        <span className={`font-playfair text-[28px] font-bold ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`}>
                          {formatPrice(webinar.basePrices?.pln || 0)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={selectedSessionId ? handleAddToCart : scrollToSessions}
                        size="lg"
                        className={cn(
                          "font-inter font-semibold px-6 rounded-xl shadow-lg",
                          isFreeWebinar
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-500/25"
                            : isDark
                              ? "bg-[#2a7a6f] hover:bg-[#33897d] text-white"
                              : "bg-[#1B5E4B] hover:bg-[#174f40] text-white"
                        )}
                      >
                        {selectedSessionId ? (
                          isFreeWebinar ? (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              {t("webinars.getFree")}
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {t("webinars.register", "Register")}
                            </>
                          )
                        ) : (
                          <>
                            <CalendarDays className="h-4 w-4 mr-2" />
                            {t("webinars.selectDate", "Choose Session")}
                          </>
                        )}
                      </Button>

                      {!isFreeWebinar && selectedSessionId && (
                        <Button
                          onClick={handleAddAsGift}
                          variant="outline"
                          size="lg"
                          className={`rounded-xl ${isDark ? 'border-pink-400/50 text-pink-300 hover:bg-pink-500/10' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}`}
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          {t("cart.gift.buyAsGift", "Gift")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Access indicator for registered users */}
                {hasAccess && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
                    <Sparkles className="h-4 w-4" />
                    <span className="font-inter font-medium text-sm">{t("webinars.registeredBadge", "Registered")}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ============================================ */}
          {/* SECTION 2: Description                       */}
          {/* ============================================ */}
          <section className="px-6 md:px-12 lg:px-[200px] py-8 md:py-12 lg:py-16">
            {/* Quote block */}
            {webinar.highlightDescription && (
              <div className={`rounded-2xl px-6 md:px-10 py-6 md:py-8 mb-10 ${isDark ? 'bg-[#162e29]' : 'bg-[#F5FAF7]'}`}>
                <p className={`font-playfair text-[18px] md:text-[22px] italic leading-relaxed text-center ${isDark ? 'text-[#a3cec3]' : 'text-[#1B5E4B]'}`}>
                  "{webinar.highlightDescription}"
                </p>
              </div>
            )}

            {/* Description content — fully expanded, no scroll container */}
            <div
              className={`font-inter prose prose-lg max-w-none
                text-[15px] md:text-[17px] leading-[1.9]
                ${isDark
                  ? 'text-[#8cbcb0] prose-headings:text-[#e8f5f0] prose-p:text-[#8cbcb0] prose-strong:text-[#e8f5f0] prose-li:text-[#8cbcb0] prose-a:text-[#5eb8a8] hover:prose-a:text-[#5eb8a8]/80'
                  : 'text-[#4A5E56] prose-headings:text-[#1B3B30] prose-p:text-[#4A5E56] prose-strong:text-[#1B3B30] prose-li:text-[#4A5E56] prose-a:text-[#1B5E4B] hover:prose-a:text-[#1B5E4B]/80'
                }
                prose-headings:font-playfair prose-headings:text-[22px] md:prose-headings:text-[28px] prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                prose-p:my-4
                prose-strong:font-semibold
                prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4
                prose-li:my-1
                prose-a:underline`}
              dangerouslySetInnerHTML={{ __html: webinar.description }}
            />
          </section>

          {/* ============================================ */}
          {/* SECTION 3: Speakers                          */}
          {/* ============================================ */}
          <section className={`px-6 md:px-12 lg:px-[200px] py-8 md:py-12 lg:py-16 ${isDark ? 'bg-[#0f2420]' : 'bg-[#F5FAF7]'}`}>
            <p className={`font-inter text-[11px] uppercase tracking-[0.15em] font-semibold mb-6 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`}>
              {guestSpeakers.length > 0
                ? t("webinars.speakers", "Speakers")
                : t("webinars.aboutHost", "About the Host")}
            </p>

            <div className="space-y-10">
              {/* Host — photo LEFT, info RIGHT */}
              <div
                className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start p-5 md:p-6 rounded-2xl"
              >
                {/* Photo */}
                <div className="w-[55%] mx-auto lg:mx-0 lg:w-[280px] flex-shrink-0">
                  {hostAvatar ? (
                    <img
                      src={hostAvatar}
                      alt={hostName}
                      className={`w-full h-auto rounded-2xl object-cover shadow-lg border-2 ${isDark ? 'border-[#5eb8a8]/20' : 'border-[#1B5E4B]/10'}`}
                    />
                  ) : (
                    <div className={`w-full aspect-square rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`}>
                      <User className={`w-16 h-16 ${isDark ? 'text-[#5eb8a8]/50' : 'text-[#1B5E4B]/30'}`} />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1">
                  <Badge className="mb-2 text-xs bg-[#1B5E4B] border-0" style={{ color: 'white' }}>{t("webinars.host", "Host")}</Badge>
                  <h2 className={`font-playfair text-[24px] md:text-[32px] font-bold mb-4 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                    {hostName}
                  </h2>
                  {hostBio && (
                    <div
                      className={`font-inter text-[15px] md:text-[16px] leading-[1.8] prose prose-sm max-w-none [&>p]:my-2 ${isDark ? 'text-[#8cbcb0] prose-p:text-[#8cbcb0]' : 'text-[#4A5E56] prose-p:text-[#4A5E56]'}`}
                      dangerouslySetInnerHTML={{ __html: hostBio }}
                    />
                  )}
                </div>
              </div>

              {/* Guest Speakers — alternating: odd guests photo RIGHT, even guests photo LEFT */}
              {guestSpeakers.map((speaker, index) => (
                <div
                  key={speaker.id}
                  className={cn(
                    "flex flex-col gap-6 lg:gap-10 items-start p-5 md:p-6 rounded-2xl",
                    index % 2 === 0 ? "lg:flex-row-reverse" : "lg:flex-row",
                    isDark ? 'border-t border-[#243f39]' : 'border-t border-[#E8EDE9]'
                  )}
                >
                  {/* Photo */}
                  <div className="w-[55%] mx-auto lg:mx-0 lg:w-[280px] flex-shrink-0">
                    {speaker.avatar ? (
                      <img
                        src={speaker.avatar}
                        alt={speaker.name}
                        className={`w-full h-auto rounded-2xl object-cover shadow-lg border-2 ${isDark ? 'border-[#5eb8a8]/20' : 'border-[#1B5E4B]/10'}`}
                      />
                    ) : (
                      <div className={`w-full aspect-square rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`}>
                        <User className={`w-12 h-12 ${isDark ? 'text-[#5eb8a8]/50' : 'text-[#1B5E4B]/30'}`} />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1">
                    <Badge className={`mb-2 text-xs ${isDark ? 'bg-[#47695b] text-white' : 'bg-[#47695b] text-white'}`}>{t("webinars.guestSpeaker", "Guest Speaker")}</Badge>
                    <h3 className={`font-playfair text-[22px] md:text-[28px] font-bold mb-4 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                      {speaker.name}
                    </h3>
                    {speaker.bio && (
                      <div
                        className={`font-inter text-[15px] md:text-[16px] leading-[1.8] prose prose-sm max-w-none [&>p]:my-2 ${isDark ? 'text-[#8cbcb0] prose-p:text-[#8cbcb0]' : 'text-[#4A5E56] prose-p:text-[#4A5E56]'}`}
                        dangerouslySetInnerHTML={{ __html: speaker.bio }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================ */}
          {/* SECTION 4: Details + Sessions                */}
          {/* ============================================ */}
          <section ref={sessionsSectionRef} className="px-6 md:px-12 lg:px-[200px] py-8 md:py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Left: Details + Sessions */}
              <div className="flex-1">
                {/* Detail Rows */}
                <h2 className={`font-playfair text-[22px] md:text-[28px] font-bold mb-6 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                  {t("webinars.details", "Webinar Details")}
                </h2>
                <div className="space-y-4 mb-10">
                  {/* Category */}
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`}>
                      <Tag className={`w-5 h-5 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`} />
                    </div>
                    <div>
                      <p className={`font-inter text-[13px] ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>{t("webinars.category", "Category")}</p>
                      <p className={`font-inter text-[15px] font-medium ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>{webinar.category || "-"}</p>
                    </div>
                  </div>
                  {/* Duration */}
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`}>
                      <Clock className={`w-5 h-5 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`} />
                    </div>
                    <div>
                      <p className={`font-inter text-[13px] ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>{t("webinars.durationLabel", "Duration")}</p>
                      <p className={`font-inter text-[15px] font-medium ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>{webinar.duration} min</p>
                    </div>
                  </div>
                  {/* Language */}
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`}>
                      <Globe className={`w-5 h-5 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`} />
                    </div>
                    <div>
                      <p className={`font-inter text-[13px] ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>{t("webinars.language", "Language")}</p>
                      <p className={`font-inter text-[15px] font-medium ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>{webinar.language?.toUpperCase() || "-"}</p>
                    </div>
                  </div>
                  {/* Capacity */}
                  {webinar.capacity > 0 && (
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]'}`}>
                        <Users className={`w-5 h-5 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`} />
                      </div>
                      <div>
                        <p className={`font-inter text-[13px] ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>{t("webinars.capacity", "Capacity")}</p>
                        <p className={`font-inter text-[15px] font-medium ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>{webinar.capacity} {t("webinars.participants", "participants")}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sessions */}
                <h3 className={`font-playfair text-[20px] md:text-[24px] font-bold mb-4 flex items-center gap-3 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                  <CalendarDays className={`h-6 w-6 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`} />
                  {t("webinars.scheduledSessions", "Scheduled Sessions")}
                </h3>

                {upcomingSessions.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="font-inter">{t("webinars.noUpcoming", "No upcoming sessions scheduled")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Next/closest session — always visible, highlighted */}
                    {(() => {
                      const nextAvailable = nextSession || upcomingSessions[0];
                      const isLive = nextAvailable.status === "live";
                      const isEnded = nextAvailable.status === "ended" || nextAvailable.status === "cancelled";
                      const spotsLeft = webinar.capacity - (nextAvailable.registeredCount || 0);
                      const isSoldOut = spotsLeft <= 0;
                      const isSelected = selectedSessionId === nextAvailable.id;
                      const isSessionPurchased = hasAccessToSession(nextAvailable.id);

                      return (
                        <div
                          onClick={() => {
                            if (!isEnded && (!isSoldOut || isSessionPurchased)) {
                              setSelectedSessionId(nextAvailable.id);
                            }
                            if (upcomingSessions.length > 1) {
                              setShowAllSessions(true);
                            }
                          }}
                          className={cn(
                            "border-2 rounded-xl p-5 transition-all cursor-pointer font-inter relative",
                            isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]/70',
                            isSelected
                              ? "border-[#5eb8a8] ring-2 ring-[#5eb8a8]/20"
                              : isDark ? 'border-[#5eb8a8]/30' : 'border-[#1B5E4B]/20',
                            isLive && "border-red-500",
                            isSessionPurchased && !isEnded && `border-green-500 ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`
                          )}
                        >
                          {/* "Next session" label */}
                          <p className={`font-inter text-[11px] uppercase tracking-[0.15em] font-semibold mb-3 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`}>
                            {isLive ? "LIVE NOW" : t("webinars.nextSession", "Next Session")}
                          </p>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {isSessionPurchased && !isEnded && (
                                  <Badge className="bg-green-600 text-white text-xs">{t("webinars.registeredBadge", "Registered")}</Badge>
                                )}
                                {isLive && (
                                  <Badge className="bg-red-600 text-white animate-pulse text-xs">
                                    <Play className="w-3 h-3 mr-1" />LIVE
                                  </Badge>
                                )}
                                {isSoldOut && !isSessionPurchased && (
                                  <Badge variant="destructive" className="text-xs">{t("webinars.soldOut", "Sold Out")}</Badge>
                                )}
                              </div>
                              <div className={`flex items-center gap-2 text-[17px] md:text-[19px] font-bold ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                                <Calendar className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`} />
                                <span>{formatSessionDate(nextAvailable.scheduledAt)}</span>
                              </div>
                              <div className={`flex items-center gap-2 text-[14px] mt-1.5 ml-7 ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>{formatSessionTime(nextAvailable.scheduledAt)}</span>
                                <span>•</span>
                                <span>{webinar.duration} min</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {isSessionPurchased && isLive && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJoinSession(nextAvailable.id);
                                  }}
                                  className={`text-white ${isDark ? 'bg-[#2a7a6f] hover:bg-[#33897d]' : 'bg-[#1B5E4B] hover:bg-[#174f40]'}`}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  {t("webinars.joinNow", "Join")}
                                </Button>
                              )}
                              {upcomingSessions.length > 1 && !showAllSessions && (
                                <span className={`flex items-center gap-1 text-[13px] font-medium ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`}>
                                  {t("webinars.viewAllDates", "View all dates")}
                                  <ChevronDown className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* All other sessions — shown when expanded */}
                    {showAllSessions && upcomingSessions.length > 1 && (
                      <div className="space-y-3 mt-2">
                        <p className={`font-inter text-[11px] uppercase tracking-[0.15em] font-semibold mt-4 mb-2 ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>
                          {t("webinars.allDates", "All available dates")}
                        </p>
                        {upcomingSessions.map((session) => {
                          const isLive = session.status === "live";
                          const isEnded = session.status === "ended" || session.status === "cancelled";
                          const spotsLeft = webinar.capacity - (session.registeredCount || 0);
                          const isSoldOut = spotsLeft <= 0;
                          const isSelected = selectedSessionId === session.id;
                          const isSessionPurchased = hasAccessToSession(session.id);

                          return (
                            <div
                              key={session.id}
                              onClick={() => !isEnded && (!isSoldOut || isSessionPurchased) && setSelectedSessionId(session.id)}
                              className={cn(
                                "border-2 rounded-xl p-4 transition-all cursor-pointer font-inter",
                                isDark ? 'bg-[#0d1f1c]' : 'bg-white',
                                isSelected
                                  ? `border-[#5eb8a8] ring-2 ring-[#5eb8a8]/20 ${isDark ? 'bg-[#162e29]' : 'bg-[#E8F5E9]/50'}`
                                  : `border-transparent ${isDark ? 'hover:border-[#5eb8a8]/40' : 'hover:border-[#1B5E4B]/30'}`,
                                isLive && "border-red-500 bg-red-50",
                                isSessionPurchased && !isEnded && `border-green-500 ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`,
                                (isEnded || (isSoldOut && !isSessionPurchased)) && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    {isSessionPurchased && !isEnded && (
                                      <Badge className="bg-green-600 text-white text-xs">{t("webinars.registeredBadge", "Registered")}</Badge>
                                    )}
                                    {isLive && (
                                      <Badge className="bg-red-600 text-white animate-pulse text-xs">
                                        <Play className="w-3 h-3 mr-1" />LIVE
                                      </Badge>
                                    )}
                                    {isSoldOut && !isSessionPurchased && (
                                      <Badge variant="destructive" className="text-xs">{t("webinars.soldOut", "Sold Out")}</Badge>
                                    )}
                                    {isEnded && (
                                      <Badge variant="secondary" className="text-xs">{t("webinars.ended", "Ended")}</Badge>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-2 text-[15px] font-semibold ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                                    <Calendar className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`} />
                                    <span className="truncate">{formatSessionDate(session.scheduledAt)}</span>
                                  </div>
                                  <div className={`flex items-center gap-2 text-[13px] mt-1 ml-6 ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span>{formatSessionTime(session.scheduledAt)}</span>
                                    <span>•</span>
                                    <span>{webinar.duration} min</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {!isEnded && !isSessionPurchased && isSoldOut && (
                                    <div className="text-xs text-red-500">
                                      <Users className="w-3 h-3 inline mr-1" />
                                      {t("webinars.soldOut", "Sold Out")}
                                    </div>
                                  )}
                                  {isSessionPurchased && isLive && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleJoinSession(session.id);
                                      }}
                                      className={`text-white text-xs ${isDark ? 'bg-[#2a7a6f] hover:bg-[#33897d]' : 'bg-[#1B5E4B] hover:bg-[#174f40]'}`}
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      {t("webinars.joinNow", "Join")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Collapse button */}
                        <button
                          onClick={() => setShowAllSessions(false)}
                          className={`w-full flex items-center justify-center gap-1 py-2 font-inter text-[13px] font-medium transition-colors ${isDark ? 'text-[#5eb8a8] hover:text-[#a3cec3]' : 'text-[#1B5E4B] hover:text-[#174f40]'}`}
                        >
                          {t("webinars.hideDates", "Hide dates")}
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!selectedSessionId && !hasAccess && upcomingSessions.length > 0 && (
                  <p className="font-inter text-center text-[13px] text-amber-600 mt-4">
                    {t("webinars.selectSessionHint", "Select a session above to register")}
                  </p>
                )}
              </div>

              {/* Right: Tags */}
              {webinar.tags && webinar.tags.length > 0 && (
                <div className="lg:w-[280px] lg:flex-shrink-0">
                  <h3 className={`font-playfair text-[18px] font-bold mb-4 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                    {t("webinars.tags", "Tags")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {webinar.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`font-inter text-[13px] px-3 py-1.5 rounded-full ${isDark ? 'bg-[#2a7a6f33] text-[#a3cec3]' : 'bg-[#E8F5E9] text-[#1B5E4B]'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ============================================ */}
          {/* SECTION 5: FAQs                              */}
          {/* ============================================ */}
          {webinar.faqs && webinar.faqs.length > 0 && (
            <section className={`px-6 md:px-12 lg:px-[200px] py-8 md:py-12 lg:py-16 border-t ${isDark ? 'border-[#243f39]' : 'border-[#E8EDE9]'}`}>
              <h2 className={`font-playfair text-[22px] md:text-[28px] font-bold mb-6 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                {t("common.faqs", "Frequently Asked Questions")}
              </h2>
              <div className="space-y-6">
                {webinar.faqs.map((faq, index) => (
                  <div key={index} className={`border-b pb-6 last:border-0 ${isDark ? 'border-[#243f39]' : 'border-[#E8EDE9]'}`}>
                    <h3 className={`font-inter font-semibold text-[16px] mb-2 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                      {faq.question}
                    </h3>
                    <p className={`font-inter text-[15px] leading-[1.8] ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ============================================ */}
          {/* SECTION 6: Final CTA                         */}
          {/* ============================================ */}
          {!hasAccess && !purchaseLoading && (
            <section
              ref={priceBarRef}
              className={`px-6 md:px-12 lg:px-[200px] py-12 md:py-16 text-center ${
                isDark
                  ? 'bg-gradient-to-b from-[#0f2420] to-[#0d1f1c]'
                  : 'bg-gradient-to-b from-[#E8F5E9] to-[#eaf9f0]'
              }`}
            >
              <h2 className={`font-playfair text-[24px] md:text-[32px] font-bold mb-3 ${isDark ? 'text-[#e8f5f0]' : 'text-[#1B3B30]'}`}>
                {isFreeWebinar
                  ? t("webinars.ctaFreeTitle", "Join this free webinar")
                  : t("webinars.ctaTitle", "Reserve your spot")}
              </h2>
              <p className={`font-inter text-[15px] md:text-[17px] mb-6 max-w-lg mx-auto ${isDark ? 'text-[#8cbcb0]' : 'text-[#5A6E64]'}`}>
                {t("webinars.ctaSubtitle", "Secure your place in this live session with experts")}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                {isFreeWebinar ? (
                  <span className="font-playfair text-[28px] font-bold text-green-600">
                    {t("webinars.free")}
                  </span>
                ) : (
                  <span className={`font-playfair text-[28px] font-bold ${isDark ? 'text-[#5eb8a8]' : 'text-[#1B5E4B]'}`}>
                    {formatPrice(webinar.basePrices?.pln || 0)}
                  </span>
                )}

                <Button
                  onClick={selectedSessionId ? handleAddToCart : scrollToSessions}
                  size="lg"
                  className={cn(
                    "font-inter font-semibold px-8 rounded-xl shadow-lg",
                    isFreeWebinar
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-500/25"
                      : isDark
                        ? "bg-[#2a7a6f] hover:bg-[#33897d] text-white"
                        : "bg-[#1B5E4B] hover:bg-[#174f40] text-white"
                  )}
                >
                  {selectedSessionId ? (
                    isFreeWebinar ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t("webinars.getFree")}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t("webinars.register", "Register")}
                      </>
                    )
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {t("webinars.selectDate", "Choose Session")}
                    </>
                  )}
                </Button>

                {!isFreeWebinar && selectedSessionId && (
                  <Button
                    onClick={handleAddAsGift}
                    variant="outline"
                    size="lg"
                    className={`rounded-xl ${isDark ? 'border-pink-400/50 text-pink-300 hover:bg-pink-500/10' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}`}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {t("cart.gift.buyAsGift", "Gift")}
                  </Button>
                )}
              </div>

              {!selectedSessionId && (
                <p className="font-inter text-[13px] text-amber-600">
                  {t("webinars.selectSessionHint", "Select a session above to register")}
                </p>
              )}

              {!isFreeWebinar && (
                <div className="mt-4">
                  <PaymentIcons color={isDark ? "white" : "black"} size="sm" />
                </div>
              )}
            </section>
          )}
        </>
      ) : null}

      {/* Mobile: Fixed Bottom Purchase Bar - Using Portal to render outside page context */}
      {webinar && !hasAccess && showFixedPriceBar && createPortal(
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-[99999] border-t shadow-[0_-4px_20px_rgba(0,0,0,0.15)] ${isDark ? 'bg-[#0d1f1c] border-[#243f39]/50' : 'bg-white border-gray-200'}`}>
          <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3">
              {/* Price Section */}
              <div className="flex-shrink-0">
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-[#629a8d]'}`}>{t("webinars.selectedSession", "Selected session")}</p>
                {isFreeWebinar ? (
                  <span className="text-lg font-bold text-green-600">
                    {t("webinars.free")}
                  </span>
                ) : (
                  <span className={`text-lg font-bold ${isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]'}`}>
                    {formatPrice(webinar.basePrices?.pln || 0)}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Gift button - only show when session is selected and not free */}
                {selectedSessionId && !isFreeWebinar && (
                  <Button
                    onClick={handleAddAsGift}
                    variant="outline"
                    size="sm"
                    className="border-pink-300 text-pink-600 hover:bg-pink-50 px-3"
                  >
                    <Gift className="h-4 w-4" />
                  </Button>
                )}

                {/* Main action button */}
                {selectedSessionId ? (
                  <Button
                    onClick={handleAddToCart}
                    size="sm"
                    className={isFreeWebinar
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-4 shadow-lg shadow-green-500/25"
                      : "bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#285f59]/90 hover:to-[#47695b]/90 text-white px-4"
                    }
                  >
                    {isFreeWebinar ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-1" />
                        <span className="text-xs font-semibold">
                          {t("webinars.getFree")}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        <span className="text-xs font-semibold">
                          {t("webinars.register", "Register")}
                        </span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={scrollToSessions}
                    size="sm"
                    className={isFreeWebinar
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-4 shadow-lg shadow-green-500/25"
                      : "bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#285f59]/90 hover:to-[#47695b]/90 text-white px-4"
                    }
                  >
                    <CalendarDays className="h-4 w-4 mr-1" />
                    <span className="text-xs font-semibold">
                      {t("webinars.selectDate", "Select Date")}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {/* Session selection hint - clickable */}
            {!selectedSessionId && (
              <button
                onClick={scrollToSessions}
                className="w-full text-center text-xs text-amber-600 mt-1 hover:text-amber-700 hover:underline"
              >
                {t("webinars.tapToSelectSession", "Tap to select a session")}
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
