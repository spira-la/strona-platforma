import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Video, Loader2 } from "lucide-react";
import { webinarsClient, webinarSessionsClient } from "@/clients";
import { useTheme } from "@/contexts/ThemeContext";
import leaftFull from "@/assets/leaftFull.png";
import leafUp from "@/assets/leafUp.png";
import { WebinarCard } from "@/components/webinar/WebinarCard";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import { CatalogProductItem } from "@/components/catalog/CatalogProductItem";
import { CatalogSeparator } from "@/components/catalog/CatalogSeparator";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { fadeInUp } from "@/lib/motionVariants";
import type { CatalogProduct } from "@/components/catalog/catalog.types";
import type {
  WebinarProduct,
  WebinarSession,
} from "@/domain/products/models/webinar.model";

const ITEMS_PER_PAGE = 12;

export const Webinars = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [webinars, setWebinars] = useState<WebinarProduct[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<WebinarSession[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch webinars with pagination
  const fetchWebinars = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      try {
        if (currentOffset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const result = await webinarsClient.getActiveWebinars(
          ITEMS_PER_PAGE + currentOffset
        );
        const newWebinars = result.slice(
          currentOffset,
          currentOffset + ITEMS_PER_PAGE
        );

        if (append) {
          setWebinars((prev) => [...prev, ...newWebinars]);
        } else {
          setWebinars(newWebinars);
        }

        setHasMore(newWebinars.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Error fetching webinars:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Fetch upcoming sessions
  const fetchUpcomingSessions = useCallback(async () => {
    try {
      const sessions = await webinarSessionsClient.getUpcomingSessions(20);
      setUpcomingSessions(sessions);
    } catch (error) {
      console.error("Error fetching upcoming sessions:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWebinars(0);
    fetchUpcomingSessions();
  }, [fetchWebinars, fetchUpcomingSessions]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const newOffset = offset + ITEMS_PER_PAGE;
          setOffset(newOffset);
          fetchWebinars(newOffset, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, offset, fetchWebinars]);

  // Get next session for each webinar
  const getNextSession = useCallback(
    (webinarId: string): WebinarSession | undefined => {
      return upcomingSessions.find((s) => s.webinarId === webinarId);
    },
    [upcomingSessions]
  );

  // Live webinars (sessions with status 'live')
  const liveWebinars = useMemo(() => {
    const liveSessionWebinarIds = upcomingSessions
      .filter((s) => s.status === "live")
      .map((s) => s.webinarId);
    return webinars.filter((w) => liveSessionWebinarIds.includes(w.id));
  }, [webinars, upcomingSessions]);

  // Handle card click navigation
  const handleWebinarClick = useCallback(
    (webinar: WebinarProduct) => {
      navigate(`/webinars/${webinar.slug || webinar.id}`);
    },
    [navigate]
  );

  // Map WebinarProduct → CatalogProduct
  const mapToCatalog = (webinar: WebinarProduct): CatalogProduct => ({
    id: webinar.id,
    slug: webinar.slug,
    name: webinar.name,
    description: webinar.description || "",
    author: webinar.host?.name,
    categoryTag: webinar.category,
    productType: "webinar",
    price: webinar.basePrices?.pln || 0,
    coverUrl: webinar.coverUrl,
    coverUrls: webinar.coverUrls,
    isOwned: false,
    navigateTo: `/webinars/${webinar.slug || webinar.id}`,
  });

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        isDark ? "bg-[#0d1f1c]" : "bg-[#eaf9f0]"
      }`}
    >
      {/* Decorative leaves - blurred */}
      <motion.img
        src={leaftFull}
        alt=""
        aria-hidden="true"
        className="absolute top-0 right-0 w-[clamp(16rem,32vw,28rem)] pointer-events-none select-none blur-[2px]"
        initial={{ opacity: 0, x: 80, y: -40 }}
        animate={{ opacity: isDark ? 0.12 : 0.45, x: 0, y: 0 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.img
        src={leafUp}
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[clamp(14rem,28vw,24rem)] pointer-events-none select-none blur-[2px]"
        initial={{ opacity: 0, x: -80, y: 40 }}
        animate={{ opacity: isDark ? 0.10 : 0.40, x: 0, y: 0 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
      />

      {/* Hero */}
      <CatalogHero
        tag={t("catalog.webinars.tag", "Webinars")}
        title={t(
          "catalog.webinars.title",
          "Live Interactive Sessions"
        )}
        subtitle={t(
          "catalog.webinars.subtitle",
          "Join expert-led live sessions for real-time learning and transformation"
        )}
      />

      {/* Live Now Section - kept with WebinarCard */}
      {liveWebinars.length > 0 && (
        <section className="px-6 md:px-12 lg:px-[120px] py-8">
          <h2
            className={`text-2xl font-bold mb-6 flex items-center gap-2 font-playfair ${
              isDark ? "text-[#e8f5f0]" : "text-[#1B3B30]"
            }`}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            {t("webinars.liveNow", "Live Now")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveWebinars.map((webinar, index) => (
              <motion.div
                key={webinar.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, margin: "-60px", amount: 0.15 }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <WebinarCard
                  webinar={webinar}
                  nextSession={getNextSession(webinar.id)}
                  onClick={() => handleWebinarClick(webinar)}
                  showTypeBadge={false}
                  className="border-red-500/50 shadow-red-500/20 shadow-lg"
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Catalog Content */}
      {loading ? (
        <CatalogSkeleton />
      ) : webinars.length === 0 ? (
        <div className="text-center py-20">
          <Video
            className={`h-16 w-16 mx-auto mb-4 ${
              isDark ? "text-[#5eb8a8]/50" : "text-[#1B5E4B]/30"
            }`}
          />
          <h2
            className={`font-playfair text-xl mb-2 ${
              isDark ? "text-[#e8f5f0]" : "text-[#1B3B30]"
            }`}
          >
            {t("webinars.noWebinars", "No webinars available")}
          </h2>
          <p
            className={`font-inter ${
              isDark ? "text-[#8cbcb0]" : "text-[#5A6E64]"
            }`}
          >
            {t(
              "webinars.noWebinarsDesc",
              "Check back soon for upcoming sessions"
            )}
          </p>
        </div>
      ) : (
        <div className="py-4 md:py-6">
          {webinars.map((webinar, index) => (
            <div key={webinar.id}>
              <CatalogProductItem
                product={mapToCatalog(webinar)}
                index={index}
                onNavigate={(path) => navigate(path)}
              />
              {index < webinars.length - 1 && <CatalogSeparator />}
            </div>
          ))}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div
                className={`flex items-center gap-2 font-inter ${
                  isDark ? "text-[#5eb8a8]" : "text-[#1B5E4B]"
                }`}
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("common.loading", "Loading more...")}</span>
              </div>
            )}
            {!hasMore && webinars.length > 0 && (
              <p
                className={`font-inter ${
                  isDark ? "text-[#8cbcb0]/50" : "text-[#8A9E94]"
                }`}
              >
                {t(
                  "webinars.noMore",
                  "You've seen all webinars"
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Webinars;
