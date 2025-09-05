import { useState, useEffect } from "react";
import { Download, User, Briefcase, Zap, Menu, ChevronLeft, Moon, Sun, Search, Loader2, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { JobFilters } from "./JobFilters";
import { JobCard } from "./JobCard";
import UserProfile from "./UserProfile";
import { AIAnalysis } from "./AIAnalysis";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJobs, fetchUserProfile, fetchLocalProfile, analyzeJob, Job, UserProfile as UserProfileType } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// Define the structure for a single filter
interface Filter {
  keywords: string;
  categories: string[];
  locations: string[];
  minBudget: string;
  maxBudget: string;
}

export const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("project management");
  const [filters, setFilters] = useState<Filter>({
    keywords: "project management",
    categories: [],
    locations: [],
    minBudget: "",
    maxBudget: "",
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: jobData, isLoading: isLoadingJobs, isError: isErrorJobs, error: errorJobs, isFetching: isFetchingJobs } = useQuery<any, Error>({
    queryKey: ['jobs', filters],
    queryFn: () => fetchJobs({ query: filters.keywords, category_ids: filters.categories, locations: filters.locations }),
    enabled: !!filters.keywords || filters.categories.length > 0 || (filters.locations && filters.locations.length > 0),
  });

  const { data: upworkProfile, isLoading: isLoadingUpworkProfile } = useQuery({
    queryKey: ['upworkProfile'],
    queryFn: fetchUserProfile
  });

  const { data: localProfile, isLoading: isLoadingLocalProfile } = useQuery({
    queryKey: ['localProfile'],
    queryFn: fetchLocalProfile
  });

  const analysisMutation = useMutation({
    mutationFn: analyzeJob,
    onSuccess: (data) => {
      queryClient.setQueryData(['jobAnalysis', selectedJob?.id], data);
    },
    onError: (error) => {
      toast({
        title: "AI Analysis Failed",
        description: error.message || "Could not analyze the job.",
        variant: "destructive",
      });
    },
  });

  const userProfile: UserProfileType | null = (upworkProfile && localProfile) ? {
    upwork_profile: upworkProfile,
    local_additions: localProfile,
  } : null;

  const jobs = jobData?.jobs || [];
  const totalJobs = jobData?.paging?.total || 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHeaderVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prevFilters => ({ ...prevFilters, keywords: searchTerm }));
  };

  const handleApplyFilters = (newFilters: Filter) => {
    setFilters(newFilters);
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!jobs || jobs.length === 0) {
      toast({
        title: "No Jobs to Export",
        description: "There are no jobs to export. Try fetching some jobs first.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

    if (format === 'json') {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(jobs, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `jobs-${dateString}.json`;
      link.click();
    } else if (format === 'csv') {
      const header = Object.keys(jobs[0]).join(",");
      const rows = jobs.map(job => {
        return Object.values(job).map(value => {
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          return value;
        }).join(",");
      }).join("\n");
      const csvString = `data:text/csv;charset=utf-8,${encodeURIComponent(
        `${header}\n${rows}`
      )}`;
      const link = document.createElement("a");
      link.href = csvString;
      link.download = `jobs-${dateString}.csv`;
      link.click();
    }

    toast({
      title: `Exporting ${format.toUpperCase()}`,
      description: `Downloading ${jobs.length} job opportunities...`,
    });
  };

  const handleAnalyzeJob = (job: Job) => {
    if (!userProfile) {
        toast({
            title: "Profile Not Loaded",
            description: "Your user profile is still loading. Please wait a moment before analyzing a job.",
            variant: "destructive",
        });
        return;
    }
    setSelectedJob(job);
    analysisMutation.mutate({ job, profile: userProfile });
  };

  const handleAnalyzeAll = () => {
    // This functionality would require significant changes and is not implemented yet.
    toast({ title: "Not Implemented", description: "Bulk analysis is not yet available." });
  };

  const analysisDataForModal = selectedJob ? queryClient.getQueryData(['jobAnalysis', selectedJob.id]) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className={`border-b bg-card/95 backdrop-blur-sm sticky top-0 z-40 transition-transform duration-300 ${ 
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="container mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Briefcase className="h-5 lg:h-6 w-5 lg:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-foreground">JobHunter AI</h1>
                <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">Smart Job Search & Analysis</p>
              </div>
            </div>
            
            <div className="flex-1 px-4 lg:px-12">
              <form onSubmit={handleSearch} className="relative">
                <Input 
                  placeholder="Search for jobs..." 
                  className="w-full pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="flex items-center space-x-1 lg:space-x-3">
              <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowProfile(true)}>
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-24 h-[calc(100vh-7.5rem)]">
                <Collapsible open={sidebarOpen} onOpenChange={setSidebarOpen} className="h-full">
                <div className="flex items-center mb-4">
                    <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-10 h-10 p-0 lg:hidden">
                        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                    </CollapsibleTrigger>
                    <h3 className="ml-3 text-lg font-semibold text-foreground lg:text-xl">Filters</h3>
                </div>
                <CollapsibleContent className="h-full" forceMount>
                    <JobFilters onApplyFilters={handleApplyFilters} isFetching={isFetchingJobs} />
                </CollapsibleContent>
                </Collapsible>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Job Results</h2>
                <p className="text-muted-foreground">
                  {isLoadingJobs ? 'Searching...' : `Found ${totalJobs} opportunities matching your criteria`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => handleExport('json')} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />JSON</Button>
                <Button onClick={() => handleExport('csv')} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />CSV</Button>
              </div>
            </div>

            <div className="space-y-4">
              {isLoadingJobs ? (
                [...Array(5)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)
              ) : isErrorJobs ? (
                <div className="text-center py-12 px-4 border border-dashed rounded-lg">
                  <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                  <h3 className="mt-4 text-lg font-semibold text-destructive">An Error Occurred</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{errorJobs.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Please check your connection or try again later.</p>
                </div>
              ) : jobs.length > 0 ? (
                jobs.map((job: Job) => (
                  <JobCard 
                    key={job.url} 
                    job={job} 
                    onAnalyze={() => handleAnalyzeJob(job)} 
                    isAnalyzing={analysisMutation.isPending && selectedJob?.id === job.id}
                    isProfileLoading={isLoadingUpworkProfile || isLoadingLocalProfile}
                  />
                ))
              ) : (
                <div className="text-center py-12 px-4 border border-dashed rounded-lg">
                  <h3 className="text-lg font-semibold">No Jobs Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search query or filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleAnalyzeAll} size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant rounded-full w-14 h-14 p-0">
          <Zap className="h-6 w-6 text-white" />
        </Button>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      
      <AIAnalysis 
        job={selectedJob}
        analysisData={analysisDataForModal}
        isLoading={analysisMutation.isPending}
        isError={analysisMutation.isError}
        error={analysisMutation.error}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
};

