import { useState } from "react";
import { Header } from "@/components/Header";
import { SearchFilters, SearchFilters as ISearchFilters } from "@/components/SearchFilters";
import { ResourceCard } from "@/components/ResourceCard";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import { ChatWidget } from "@/components/ChatWidget";
import { TrendingUp, Star, Clock, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchResources, type ResourceResponse } from "@/lib/api";
import { useFavorites } from "@/hooks/use-favorites";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [filters, setFilters] = useState<ISearchFilters>({
    query: "",
    type: "all",
    language: "all",
    framework: "all",
    difficulty: "all",
    tags: [],
  });

  const [showCategories, setShowCategories] = useState(true);
  const [sortBy, setSortBy] = useState<"relevance" | "rating" | "newest" | "popular">("relevance");
  const [currentView, setCurrentView] = useState<"home" | "popular" | "latest">("home");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const { isFavorite, toggleFavorite } = useFavorites();
  // Fetch resources dynamically
  const { data, isLoading, isError, refetch } = useQuery<ResourceResponse, Error>({
    queryKey: [
      "resources",
      filters.query,
      filters.type,
      filters.language,
      filters.framework,
      filters.difficulty,
      JSON.stringify(filters.tags),
      sortBy,
      page,
      pageSize,
    ],
    queryFn: async () => {
      // Sort parameter can be sent to backend in the future; for now it is local or provider-defined
      return fetchResources({
        query: filters.query,
        type: filters.type,
        language: filters.language,
        framework: filters.framework,
        difficulty: filters.difficulty,
        tags: filters.tags,
        page,
        pageSize,
      });
    },
    refetchOnWindowFocus: false,
  });

  const handleSearch = () => {
    setShowCategories(false);
    setPage(1);
    refetch();
  };

  const handleCategorySelect = (categoryId: string) => {
    // Map category to language/framework filters
    const categoryMappings: Record<string, Partial<ISearchFilters>> = {
      frontend: { language: "javascript" },
      backend: { language: "python" },
      database: { tags: ["database"] },
      mobile: { tags: ["mobile"] },
      devops: { tags: ["devops"] },
      security: { tags: ["security"] },
      design: { tags: ["ui/ux"] },
      "ai-ml": { tags: ["machine-learning"] },
      web3: { tags: ["blockchain"] },
      performance: { tags: ["performance"] },
      apis: { tags: ["api"] },
      tools: { tags: ["tools"] },
    };

    const categoryFilter = categoryMappings[categoryId] || {};
    setFilters(prev => ({ ...prev, ...categoryFilter }));
    setShowCategories(false);
    setPage(1);
  };

  const handleNavigation = (section: string) => {
    switch (section) {
      case 'browse':
        setShowCategories(true);
        setCurrentView("home");
        break;
      case 'categories':
        setShowCategories(true);
        setCurrentView("home");
        break;
      case 'popular':
        setShowCategories(false);
        setSortBy("popular");
        setCurrentView("popular");
        break;
      case 'latest':
        setShowCategories(false);
        setSortBy("newest");
        setCurrentView("latest");
        break;
    }
  };

  const handleBookmark = (resourceId: string) => {
    toggleFavorite(resourceId);
  };

  const hasSearched = !showCategories || filters.query || (filters.type && filters.type !== "all") || (filters.language && filters.language !== "all") || (filters.framework && filters.framework !== "all") || (filters.difficulty && filters.difficulty !== "all") || filters.tags.length > 0;

  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const items = data?.items || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onNavigate={handleNavigation} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 text-center bg-gradient-hero overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Find Development Resources
                <span className="block text-white/90">Faster Than Ever</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Stop wasting time searching. Discover curated tutorials, documentation,
                and guides from the developer community in seconds.
              </p>
              <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>5,000+ Resources</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Developer Community</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Curated Content</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
          />
        </div>

        {/* Categories or Results */}
        {showCategories && !hasSearched ? (
          <CategoryGrid onCategorySelect={handleCategorySelect} />
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {isLoading ? "Loading..." : `${total} Resources Found`}
                </h2>
                <p className="text-muted-foreground">
                  {filters.query && `Results for "${filters.query}"`}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <div className="flex gap-1">
                  {[
                    { key: "relevance", label: "Relevance", icon: TrendingUp },
                    { key: "rating", label: "Rating", icon: Star },
                    { key: "newest", label: "Newest", icon: Clock },
                    { key: "popular", label: "Popular", icon: Users },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={sortBy === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy(key as any)}
                      className="gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Back to Categories */}
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  query: "",
                  type: "all",
                  language: "all",
                  framework: "all",
                  difficulty: "all",
                  tags: [],
                });
                setShowCategories(true);
                setPage(1);
              }}
              className="mb-4"
            >
              ← Browse Categories
            </Button>

            {/* Resource Grid */}
            {isError && (
              <div className="text-center py-12">
                <p className="text-destructive text-lg">Failed to fetch resources. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && !isError && items.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={{ ...resource, bookmarked: isFavorite(resource.id) }}
                      onBookmark={handleBookmark}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        {page} / {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.min(totalPages, p + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No resources found matching your criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    query: "",
                    type: "all",
                    language: "all",
                    framework: "all",
                    difficulty: "all",
                    tags: [],
                  })}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Chat Widget - bottom right */}
      <div className="fixed bottom-4 right-4 z-50">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg h-12 px-4 gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 w-auto max-w-none border-none sm:rounded-lg">
            <div className="bg-background sm:rounded-lg border">
              <ChatWidget />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
