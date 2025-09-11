import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';

interface AnalyzedJobsProps {
  analyzedJobs: any[];
}

export const AnalyzedJobs = ({ analyzedJobs }: AnalyzedJobsProps) => {
  const [internalJobs, setInternalJobs] = useState<any[]>(analyzedJobs);

  useEffect(() => {
    if (analyzedJobs.length === 0) {
      const storedResults = sessionStorage.getItem('analysisResults');
      if (storedResults) {
        try {
          const parsed = JSON.parse(storedResults);
          if (Array.isArray(parsed)) {
            setInternalJobs(parsed);
          }
        } catch (e) {
          console.error("Failed to parse analysis results from storage", e);
        }
      }
    } else {
      setInternalJobs(analyzedJobs);
    }
  }, [analyzedJobs]);

  if (internalJobs.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed rounded-lg">
        <h3 className="text-lg font-semibold">No Jobs Analyzed Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Run a bulk analysis from the Job Feed to see results here.</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score > 85) return 'bg-green-500';
    if (score > 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <CardHeader className="px-0">
        <CardTitle>Analyzed Job Opportunities</CardTitle>
        <CardDescription>Review the AI-powered analysis of potential jobs.</CardDescription>
      </CardHeader>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {internalJobs.map((result: any, index: number) => (
          <Card key={result.job_data.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-semibold leading-tight pr-4">{result.job_data.title}</CardTitle>
                <div className={`flex-shrink-0 text-white text-sm font-bold w-12 h-12 rounded-full flex items-center justify-center ${getScoreColor(result.suitability_score)}`}>
                  {result.suitability_score}
                </div>
              </div>
              <CardDescription className="text-xs pt-2">{result.analysis_summary}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center"><ThumbsUp className="h-4 w-4 mr-2 text-green-500"/>Strengths</h4>
                <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                  {result.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>Not available</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center"><ThumbsDown className="h-4 w-4 mr-2 text-red-500"/>Weaknesses</h4>
                <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                  {result.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>) || <li>Not available</li>}
                </ul>
              </div>
            </CardContent>
            <div className="p-4 border-t mt-auto">
                <Link to={`/analysis/${result.job_data.id}`} state={{ analysisResult: result }} className="w-full">
                    <Button variant="default" className="w-full">
                        View Full Analysis & Proposal
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};