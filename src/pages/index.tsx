import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useSeriesWithLatestChapters, useFeaturedSeries } from "@/hooks/useSeriesWithLatestChapters";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { LatestUpdateCard } from "@/components/home/LatestUpdateCard";
import { PopularSidebar } from "@/components/home/PopularSidebar";
import { JoinUsCard } from "@/components/home/JoinUsCard";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { Data527Ad } from "@/components/ads/Data527Ad";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: featuredData, isLoading: isFeaturedLoading } = useFeaturedSeries();
  const { data: latestSeriesData, isLoading: isLatestLoading } = useSeriesWithLatestChapters(12);
  const featuredSeries = featuredData || [];
  const latestSeries = latestSeriesData || [];

  // Secret URL parameter access: ?access=bntoonadmin
  useEffect(() => {
    const accessCode = searchParams.get("access");
    if (accessCode === "bntoonadmin") {
      navigate("/admin");
    }
  }, [searchParams, navigate]);


  return (
    <Layout>
      <SEO />
      <main className="min-h-screen">
        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Column - Featured + Latest Updates */}
            <div className="lg:col-span-3">
              {/* Featured Section */}
              {isFeaturedLoading ? (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Skeleton className="w-full sm:w-32 aspect-[3/4] rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16 rounded" />
                          <Skeleton className="h-5 w-16 rounded" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-8 w-24 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : featuredSeries.length > 0 ? (
                <FeaturedSection series={featuredSeries} />
              ) : null}

              {/* Ad between Featured and Latest Updates - 468x60 Banner */}
              <div className="my-6 flex justify-center">
                <Data527Ad
                  width={468}
                  height={60}
                  dataClass="jf93c9f9f58"
                  dataDomain="//data527.click"
                  dataAffQuery="/16a22f324d5687c1f7a4/f93c9f9f58/?placementName=MiniBanner"
                  placementId="home-featured-banner"
                />
              </div>

              {/* Latest Updates Section */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <h2 className="font-display text-xl font-bold text-foreground">Latest Updates</h2>
                  </div>
                  <Link 
                    to="/browse" 
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors group"
                  >
                    VIEW ALL 
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                
                {isLatestLoading ? (
                  <div className="bg-card rounded-xl border border-border divide-y divide-border">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="p-4 flex gap-4">
                        <Skeleton className="w-[80px] aspect-[3/4] rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : latestSeries.length > 0 ? (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 divide-border">
                      {latestSeries.map((s, index) => (
                        <div
                          key={s.id}
                          className={`border-border ${
                            index < latestSeries.length - 2 ? "md:border-b" : ""
                          } ${index % 2 === 0 ? "md:border-r" : ""} ${
                            index !== latestSeries.length - 1 ? "border-b md:border-b-0" : ""
                          } ${Math.floor(index / 2) < Math.floor((latestSeries.length - 1) / 2) ? "md:border-b" : ""}`}
                        >
                          <LatestUpdateCard
                            id={s.id}
                            title={s.title}
                            coverUrl={s.cover_url}
                            status={s.status}
                            type={s.type}
                            chapters={s.chapters}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border p-16 text-center">
                    <p className="text-muted-foreground">No series available yet.</p>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <PopularSidebar />
              {/* Sidebar Ad between Popular and Join Us */}
              <Data527Ad
                width={0}
                height={0}
                dataClass="m5afd89751f"
                dataDomain="//data527.click"
                dataAffQuery="/5fbf3d48481d384a64a7/5afd89751f/?placementName=LargeBanner"
                placementId="home-sidebar"
              />
              <JoinUsCard />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Index;
