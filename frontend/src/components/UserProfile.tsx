import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUserProfile, fetchLocalProfile, updateLocalProfile } from "../lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Save, Loader2, Briefcase, GraduationCap, Star, BookUser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile = ({ onClose }: UserProfileProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for editable fields
  const [location, setLocation] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [localSkills, setLocalSkills] = useState<string[]>([]);
  const [localCertificates, setLocalCertificates] = useState<string[]>([]);
  const [localEducation, setLocalEducation] = useState<string[]>([]);

  // Edit mode states for each section
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingCertificates, setIsEditingCertificates] = useState(false);
  const [isEditingEducation, setIsEditingEducation] = useState(false);

  // Fetch Upwork Profile Data
  const { data: upworkProfile, isLoading: isLoadingUpwork } = useQuery({
    queryKey: ['upworkProfile'],
    queryFn: fetchUserProfile
  });

  // Fetch Local Editable Profile Data
  const { data: localProfile, isLoading: isLoadingLocal } = useQuery({
    queryKey: ['localProfile'],
    queryFn: fetchLocalProfile
  });

  // Effect to update local form state when data is fetched
  useEffect(() => {
    if (localProfile) {
      setLocation(localProfile.location || "");
      setAdditionalDetails(localProfile.additional_details || "");
      setLocalSkills(localProfile.local_skills || []);
      setLocalCertificates(localProfile.local_certificates || []);
      setLocalEducation(localProfile.local_education || []);
    }
  }, [localProfile]);

  const mutation = useMutation({
    mutationFn: updateLocalProfile,
    onSuccess: () => {
      toast({ title: "Success", description: "Your profile has been updated." });
      queryClient.invalidateQueries({ queryKey: ['localProfile'] });
      // Exit all edit modes after saving
      setIsEditingDetails(false);
      setIsEditingSkills(false);
      setIsEditingCertificates(false);
      setIsEditingEducation(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to update profile: ${error.message}`, variant: "destructive" });
    },
  });

  const handleSave = () => {
    mutation.mutate({
      location,
      additional_details: additionalDetails,
      local_skills: localSkills,
      local_certificates: localCertificates,
      local_education: localEducation,
    });
  };

  const handleCancel = (section: string) => {
    if (localProfile) {
      switch (section) {
        case 'details':
          setLocation(localProfile.location || "");
          setAdditionalDetails(localProfile.additional_details || "");
          setIsEditingDetails(false);
          break;
        case 'skills':
          setLocalSkills(localProfile.local_skills || []);
          setIsEditingSkills(false);
          break;
        case 'certificates':
          setLocalCertificates(localProfile.local_certificates || []);
          setIsEditingCertificates(false);
          break;
        case 'education':
          setLocalEducation(localProfile.local_education || []);
          setIsEditingEducation(false);
          break;
      }
    }
  };

  const isLoading = isLoadingUpwork || isLoadingLocal;

  const renderContent = () => {
    if (isLoading) {
      return <div className="p-6"><Skeleton className="h-[80vh] w-full" /></div>;
    }

    const fullName = upworkProfile?.fullName || "Name not available";
    const title = upworkProfile?.personalData?.title || "Title not available";
    const description = upworkProfile?.personalData?.description || "No description provided.";
    const fallback = fullName.charAt(0) || "U";

    return (
      <>
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={fullName} />
                <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <p className="text-md text-muted-foreground">{title}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* --- About Me Section (Upwork) --- */}
          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p></CardContent>
          </Card>

          {/* --- Editable Local Data Section --- */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Details</CardTitle>
                {!isEditingDetails ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(true)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleCancel('details')}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
                      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
                      Save All
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-medium text-sm">Location</label>
                {isEditingDetails ? (
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., San Francisco, CA" />
                ) : (
                  <p className="text-muted-foreground">{location || "Not set"}</p>
                )}
              </div>
              <div>
                <label className="font-medium text-sm">Additional Experience / Education</label>
                {isEditingDetails ? (
                  <Textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} placeholder="Add any other relevant details here..." className="min-h-[150px]"/>
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">{additionalDetails || "Not set"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* --- Employment History (Upwork) --- */}
          {upworkProfile?.employmentRecords?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center"><Briefcase className="h-5 w-5 mr-3"/>Employment History (Upwork)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {upworkProfile.employmentRecords.map((job: any, index: number) => (
                  <div key={index}>
                    <h4 className="font-semibold">{job.role || 'N/A'}</h4>
                    <p className="text-sm text-muted-foreground">{job.companyName}</p>
                    <p className="text-xs text-muted-foreground/80">{job.startDate} - {job.endDate || 'Present'}</p>
                    {job.description && <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* --- Skills (Upwork) --- */}
          {upworkProfile?.skills?.edges?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center"><Star className="h-5 w-5 mr-3"/>Skills (Upwork)</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {upworkProfile.skills.edges.map((edge: any) => (
                  <Badge key={edge.node.id} variant="secondary">ID: {edge.node.id}</Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {/* --- Local Skills --- */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center"><Star className="h-5 w-5 mr-3"/>Your Skills</CardTitle>
                {!isEditingSkills ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingSkills(true)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleCancel('skills')}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
                      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
                      Save All
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingSkills ? (
                <Textarea 
                  value={localSkills.join('\n')}
                  onChange={(e) => setLocalSkills(e.target.value.split('\n'))}
                  placeholder="Enter your skills, one per line" 
                  className="min-h-[100px]"
                />
              ) : (
                localSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {localSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No custom skills added.</p>
                )
              )}
            </CardContent>
          </Card>

          {/* --- Certificates (Upwork) --- */}
          {upworkProfile?.certificates?.filter((c: any) => c.notes).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center"><BookUser className="h-5 w-5 mr-3"/>Certificates (Upwork)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {upworkProfile.certificates.map((cert: any, index: number) => cert.notes && (
                  <p key={index} className="text-sm text-muted-foreground whitespace-pre-wrap">{cert.notes}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* --- Local Certificates --- */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center"><BookUser className="h-5 w-5 mr-3"/>Your Certificates</CardTitle>
                {!isEditingCertificates ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingCertificates(true)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleCancel('certificates')}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
                      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
                      Save All
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingCertificates ? (
                <Textarea 
                  value={localCertificates.join('\n')}
                  onChange={(e) => setLocalCertificates(e.target.value.split('\n'))}
                  placeholder="Enter your certificates, one per line (e.g., AWS Certified - Solutions Architect - 2021)" 
                  className="min-h-[100px]"
                />
              ) : (
                localCertificates.length > 0 ? (
                  <div className="space-y-1">
                    {localCertificates.map((cert, index) => (
                      <p key={index} className="text-sm text-muted-foreground">{cert}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No custom certificates added.</p>
                )
              )}
            </CardContent>
          </Card>

          {/* --- Education (Upwork) --- */}
          {upworkProfile?.educationRecords?.length > 0 && (
             <Card>
              <CardHeader><CardTitle className="flex items-center"><GraduationCap className="h-5 w-5 mr-3"/>Education (Upwork)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {upworkProfile.educationRecords.map((edu: any, index: number) => (
                  <div key={index}>
                    <p className="font-semibold">{edu.degree || "Degree not specified"}</p>
                    <p className="text-sm text-muted-foreground">{edu.areaOfStudy || "Field of study not specified"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* --- Local Education --- */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center"><GraduationCap className="h-5 w-5 mr-3"/>Your Education</CardTitle>
                {!isEditingEducation ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingEducation(true)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleCancel('education')}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
                      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
                      Save All
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingEducation ? (
                <Textarea 
                  value={localEducation.join('\n')}
                  onChange={(e) => setLocalEducation(e.target.value.split('\n'))}
                  placeholder="Enter your education, one per line (e.g., PhD in CS - MIT - 2020)" 
                  className="min-h-[100px]"
                />
              ) : (
                localEducation.length > 0 ? (
                  <div className="space-y-1">
                    {localEducation.map((edu, index) => (
                      <p key={index} className="text-sm text-muted-foreground">{edu}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No custom education added.</p>
                )
              )}
            </CardContent>
          </Card>

        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default UserProfile;