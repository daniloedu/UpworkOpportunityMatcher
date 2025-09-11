import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle, AlertCircle, Star, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Job, UserProfile as UserProfileType, generateProposal } from "../lib/api";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface AIAnalysisProps {
  job: Job | null;
  analysisData: any;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onClose: () => void;
  userProfile: UserProfileType | null;
}

const loadingMessages = [
  "Analyzing the job description...",
  "Matching against your profile...",
  "Cross-referencing your skills and experience...",
  "Identifying key strengths and weaknesses...",
  "Generating actionable proposal suggestions...",
  "Finalizing the analysis...",
];

const LoadingAnimation = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-80 text-center p-6 bg-background rounded-lg">
        <Brain className="h-16 w-16 text-primary animate-pulse mb-6" />
        <div className="relative h-6 w-full max-w-md overflow-hidden">
            {loadingMessages.map((msg, index) => (
                <span
                    key={index}
                    className={`absolute w-full flex items-center justify-center transition-all duration-500 ease-in-out ${messageIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
                    {msg}
                </span>
            ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">Please wait, this may take a moment.</p>
    </div>
  );
};

export const AIAnalysis = ({ job, analysisData, isLoading, isError, error, onClose, userProfile }: AIAnalysisProps) => {
  const { toast } = useToast();
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);

  const proposalMutation = useMutation({
    mutationFn: generateProposal,
    onSuccess: (data) => {
      setGeneratedProposal(data.proposal_text);
    },
    onError: (error) => {
      toast({
        title: "Proposal Generation Failed",
        description: error.message || "Could not generate the proposal.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateProposal = () => {
    if (!job || !userProfile || !analysisData) return;

    proposalMutation.mutate({
        job,
        profile: userProfile,
        analysis: analysisData,
    });
  };


  const handleSaveInsights = () => {
    if (!analysisData || !job) return;

    const title = job.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `job_analysis_${title}_${date}.txt`;

    let content = `AI ANALYSIS FOR JOB: ${job.title}\n`;
    content += `URL: ${job.url}\n`;
    content += `ANALYSIS DATE: ${new Date().toLocaleString()}\n`;
    content += `==================================================\n\n`;

    content += `SUITABILITY SCORE: ${analysisData.suitability_score}%

`;
    content += `--- ANALYSIS SUMMARY ---
${analysisData.analysis_summary}\n\n`;

    content += `--- STRENGTHS ---
`;
    analysisData.strengths.forEach((s: string) => content += `- ${s}\n`);
    content += `\n`;

    content += `--- WEAKNESSES / GAPS ---
`;
    analysisData.weaknesses.forEach((w: string) => content += `- ${w}\n`);
    content += `\n`;

    content += `--- PROPOSAL SUGGESTIONS ---
`;
    analysisData.proposal_suggestions.forEach((p: string) => content += `- ${p}\n`);
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

  const renderContent = () => {
    if (isLoading) {
      return <LoadingAnimation />; 
    }

    if (isError) {
      return (
        <div className="text-center py-10 px-4">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold text-destructive">Analysis Failed</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error?.message || "An unknown error occurred."}</p>
          <p className="mt-1 text-xs text-muted-foreground">The AI analysis service could not be reached or failed. Please try again later.</p>
        </div>
      );
    }

    if (!analysisData) {
      return null;
    }

    const scoreColor = analysisData.suitability_score > 80 ? "bg-success" : analysisData.suitability_score > 60 ? "bg-yellow-500" : "bg-destructive";

    return (
      <div className="space-y-6 p-1">
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">Suitability Score</h3>
                <p className="text-primary-foreground/80 max-w-prose">{analysisData.analysis_summary}</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold">{analysisData.suitability_score}%</div>
              </div>
            </div>
            <Progress value={analysisData.suitability_score} className={`mt-4 h-2 [&>*]:${scoreColor}`} />
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
                {analysisData.strengths.map((strength: string, index: number) => (
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
                {analysisData.weaknesses.map((weakness: string, index: number) => (
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
              {analysisData.proposal_suggestions.map((rec: string, index: number) => (
                <li key={index} className="text-sm">{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Dialog open={!!job} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <Brain className="h-6 w-6 text-primary" />
              <span>AI Job Analysis</span>
            </DialogTitle>
            <DialogDescription>
              Analysis of your profile against: <strong>{job?.title || 'Job'}</strong>
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
          <DialogFooter className="pt-4">
              <Button 
                  variant="secondary" 
                  onClick={handleGenerateProposal} 
                  disabled={!analysisData || isLoading || proposalMutation.isPending}
              >
                  {proposalMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                      <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Proposal
              </Button>
              <Button variant="outline" onClick={handleSaveInsights} disabled={!analysisData || isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Save Insights
              </Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!generatedProposal} onOpenChange={(isOpen) => !isOpen && setGeneratedProposal(null)}>
          <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Generated Proposal</DialogTitle>
              </DialogHeader>
              <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto p-1">
                  <p>{generatedProposal}</p>
              </div>
              <DialogFooter>
                  <Button onClick={() => {
                      navigator.clipboard.writeText(generatedProposal || "");
                      toast({ title: "Copied to clipboard!" });
                  }}>Copy</Button>
                  <Button variant="outline" onClick={() => setGeneratedProposal(null)}>Close</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
};

