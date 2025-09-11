import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiConfig, saveApiConfig, ApiConfig } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

export const ApiConfigForm = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [config, setConfig] = useState<ApiConfig>({ provider: 'google' });

  const { data: apiConfig, isLoading } = useQuery({
    queryKey: ['apiConfig'],
    queryFn: getApiConfig,
  });

  useEffect(() => {
    if (apiConfig) {
      setConfig(apiConfig);
    }
  }, [apiConfig]);

  const mutation = useMutation({
    mutationFn: saveApiConfig,
    onSuccess: () => {
      toast({ title: 'Success', description: 'API configuration saved.' });
      queryClient.invalidateQueries({ queryKey: ['apiConfig'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: `Failed to save config: ${error.message}`, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    mutation.mutate(config);
  };

  const handleChange = (key: keyof ApiConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div>Loading API Configuration...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider Configuration</CardTitle>
        <CardDescription>Select and configure your preferred AI provider for job analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select value={config.provider} onValueChange={(value) => handleChange('provider', value)}>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Gemini</SelectItem>
              <SelectItem value="aws">AWS Bedrock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.provider === 'aws' && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold text-sm">AWS Bedrock Credentials</h4>
            <p className="text-xs text-muted-foreground">
              Optional. If you leave these fields blank, the application will try to use AWS credentials from your environment (e.g., from `aws configure`).
            </p>
            <div className="space-y-2">
              <Label htmlFor="aws_access_key_id">AWS Access Key ID</Label>
              <Input
                id="aws_access_key_id"
                type="password"
                value={config.aws_access_key_id || ''}
                onChange={(e) => handleChange('aws_access_key_id', e.target.value)}
                placeholder="Optional: Enter your AWS Access Key ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aws_secret_access_key">AWS Secret Access Key</Label>
              <Input
                id="aws_secret_access_key"
                type="password"
                value={config.aws_secret_access_key || ''}
                onChange={(e) => handleChange('aws_secret_access_key', e.target.value)}
                placeholder="Optional: Enter your AWS Secret Access Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aws_region">AWS Region</Label>
              <Input
                id="aws_region"
                value={config.aws_region || ''}
                onChange={(e) => handleChange('aws_region', e.target.value)}
                placeholder="e.g., us-west-2"
              />
            </div>
          </div>
        )}

        {config.provider === 'google' && (
            <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                    The Google API key is managed centrally by the application administrator in the backend `.env` file. No configuration is needed here.
                </p>
            </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} 
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
