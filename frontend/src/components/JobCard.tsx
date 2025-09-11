import {
  Star,
  MapPin,
  Clock,
  Zap,
  ExternalLink,
  Briefcase,
  Verified,
  ShieldAlert,
  User,
  Users,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import { Job } from '../lib/api';

interface JobCardProps {
  job: Job;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isProfileLoading: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onAnalyze, isAnalyzing, isProfileLoading }) => {
  const isVerified = job.client?.verification_status === 'VERIFIED';
  const location = job.client?.country || 'Worldwide';
  const posted = job.date_created ? formatDistanceToNow(new Date(job.date_created), { addSuffix: true }) : 'N/A';
  const clientRating = job.client?.total_feedback;
  const clientReviews = job.client?.total_reviews;

  return (
    <Card className="hover:shadow-elegant transition-smooth border-border/50 hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer transition-smooth">
                {job.title}
              </a>
              {isVerified && (
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                  <Star className="h-3 w-3 mr-1 fill-primary" />
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-3">
              <span className="font-medium text-foreground capitalize">{job.job_type?.replace('_', ' ').toLowerCase() || 'N/A'}</span>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
              </div>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{posted}</span>
              </div>
              {clientRating > 0 &&
                <>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                    <span className="font-bold">{clientRating.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">({clientReviews} reviews)</span>
                  </div>
                </>
              }
            </div>
          </div>
          
          <div className="sm:text-right">
            <div className="text-lg font-bold text-primary">{job.rate_display}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-foreground mb-4 leading-relaxed line-clamp-3">
          {job.snippet}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills?.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {/* Proposal count is not available in the new API response */}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:space-x-2">
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing || isProfileLoading}
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 shadow-md flex items-center justify-center space-x-2 w-full sm:w-auto transition-all duration-300 ease-in-out transform hover:scale-105"
              size="sm"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">{isAnalyzing ? 'Analyzing...' : 'AI Analyze'}</span>
            </Button>
            
            <Button 
              asChild
              variant="outline" 
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              size="sm"
            >
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">View on Upwork</span>
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
