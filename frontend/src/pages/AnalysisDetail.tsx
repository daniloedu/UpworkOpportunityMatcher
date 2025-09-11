import { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle, AlertCircle, Star, Download, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AnalysisDetail = () => {
  const location = useLocation();
  const { jobId } = useParams<{ jobId: string }>();
  const [analysisResult, setAnalysisResult] = useState(location.state?.analysisResult);
  const { toast } = useToast();

  useEffect(() => {
    if (!analysisResult && jobId) {
      const storedResults = sessionStorage.getItem('analysisResults');
      if (storedResults) {
        try {
          const results = JSON.parse(storedResults);
          const foundResult = results.find((r: any) => r.job_data.id === jobId);
          if (foundResult) {
            setAnalysisResult(foundResult);
          }
        } catch (e) {
          console.error("Failed to parse or find analysis result from storage", e);
        }
      }
    }
  }, [analysisResult, jobId]);

  const handleSaveInsights = () => {
    if (!analysisResult) return;

    const job = analysisResult.job_data;
    const title = job.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `job_analysis_${title}_${date}.txt`;

    let content = `AI ANALYSIS FOR JOB: ${job.title}\n`;
    content += `URL: ${job.url}\n`;
    content += `ANALYSIS DATE: ${new Date().toLocaleString()}\n`;
    content += `==================================================\n\n`;

    content += `SUITABILITY SCORE: ${analysisResult.suitability_score}%\n\n`;
    content += `--- ANALYSIS SUMMARY ---\n${analysisResult.analysis_summary}\n\n`;

    content += `--- STRENGTHS ---\n`;
    analysisResult.strengths.forEach((s: string) => content += `- ${s}\n`);
    content += `\n`;

    content += `--- WEAKNESSES / GAPS ---\n`;
    analysisResult.weaknesses.forEach((w: string) => content += `- ${w}\n`);
    content += `\n`;

    content += `--- PROPOSAL SUGGESTIONS ---\n`;
    analysisResult.proposal_suggestions.forEach((p: string) => content += `- ${p}\n`);
    content += `\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Insights Saved",
      description: `Analysis has been saved to ${filename}`,
    });
  };

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Analysis not found</h1>
        <p className="text-muted-foreground mb-8">Could not find the analysis data. Please go back and try again.</p>
        <Link to="/?tab=analyzedJobs">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analyzed Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const scoreColor = analysisResult.suitability_score > 80 ? "bg-success" : analysisResult.suitability_score > 60 ? "bg-yellow-500" : "bg-destructive";

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-center">
            <Link to="/?tab=analyzedJobs">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Analyzed Jobs
                </Button>
            </Link>
            <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={() => {}} disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Proposal
                </Button>
                <Button variant="outline" onClick={handleSaveInsights}>
                    <Download className="h-4 w-4 mr-2" />
                    Save Insights
                </Button>
            </div>
        </div>
        
        <div className="space-y-6 p-1">
            <Card className="bg-gradient-to-r from-primary to-primary/80 border-0">
            <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-2xl font-bold mb-1">Suitability Score</h3>
                    <p className="text-primary-foreground/80 max-w-prose">{analysisResult.analysis_summary}</p>
                </div>
                <div className="text-center">
                    <div className="text-5xl font-bold">{analysisResult.suitability_score}%</div>
                </div>
                </div>
                <Progress value={analysisResult.suitability_score} className={`mt-4 h-2 [&>*]:${scoreColor}`} />
            </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span>Strengths</span>
                </CardTitle>
                </CardHeader>
                <CardContent>
                <ul className="space-y-3 list-disc pl-5">
                    {analysisResult.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-sm">{strength}</li>
                    ))}
                </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>Weaknesses / Gaps</span>
                </CardTitle>
                </CardHeader>
                <CardContent>
                <ul className="space-y-3 list-disc pl-5">
                    {analysisResult.weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="text-sm">{weakness}</li>
                    ))}
                </ul>
                </CardContent>
            </Card>
            </div>

            <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>Proposal Suggestions</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 list-disc pl-5">
                {analysisResult.proposal_suggestions.map((rec: string, index: number) => (
                    <li key={index} className="text-sm">{rec}</li>
                ))}
                </ul>
            </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default AnalysisDetail;

