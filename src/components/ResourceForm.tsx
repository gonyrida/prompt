import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Video, Book, File, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase';
import { SupabaseService, supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';

type Resource = Database['public']['Tables']['resources']['Row'];
type ResourceInsert = Database['public']['Tables']['resources']['Insert'];

interface ResourceFormProps {
  resource?: Resource | null;
  onSuccess: (resource: Resource) => void;
  onCancel: () => void;
}

export function ResourceForm({ resource, onSuccess, onCancel }: ResourceFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'article' as const,
    language: 'general',
    framework: '',
    difficulty: 'intermediate' as const,
    tags: [] as string[],
    author: '',
  });
  const [newTag, setNewTag] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        description: resource.description || '',
        url: resource.url,
        type: resource.type,
        language: resource.language,
        framework: resource.framework || '',
        difficulty: resource.difficulty,
        tags: resource.tags,
        author: resource.author || '',
      });
    }
  }, [resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let finalUrl = formData.url;

      // Handle file upload if a file is selected
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('resources')
          .getPublicUrl(fileName);

        finalUrl = publicUrl;
      }

      const resourceData: ResourceInsert = {
        title: formData.title,
        description: formData.description,
        url: finalUrl,
        type: formData.type,
        language: formData.language,
        framework: formData.framework || null,
        difficulty: formData.difficulty,
        tags: formData.tags,
        author: formData.author || null,
        user_id: user.id,
      };

      let result;
      if (resource) {
        // Update existing resource
        result = await SupabaseService.updateResource(resource.id, user.id, resourceData);
      } else {
        // Create new resource
        result = await SupabaseService.createResource(resourceData);
      }

      toast({
        title: "Success",
        description: resource ? "Resource updated successfully" : "Resource created successfully",
      });

      onSuccess(result);
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: "Failed to save resource",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // Validate file type
      const allowedTypes = ['application/pdf', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only PDF and video files are allowed');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      setUploadedFile(file);
      
      // Auto-detect type based on file
      if (file.type === 'application/pdf') {
        setFormData(prev => ({ ...prev, type: 'pdf' }));
      } else if (file.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, type: 'video' }));
      }

      toast({
        title: "File uploaded",
        description: "File ready for upload",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'book': return <Book className="h-4 w-4" />;
      case 'doc': return <FileText className="h-4 w-4" />;
      case 'pdf': return <File className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            placeholder="Enter resource title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="article">
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Article
                </span>
              </SelectItem>
              <SelectItem value="video">
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video
                </span>
              </SelectItem>
              <SelectItem value="book">
                <span className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  Book
                </span>
              </SelectItem>
              <SelectItem value="doc">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentation
                </span>
              </SelectItem>
              <SelectItem value="pdf">
                <span className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  PDF
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the resource..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          required
          placeholder="https://example.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
            placeholder="e.g., JavaScript, Python"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="framework">Framework</Label>
          <Input
            id="framework"
            value={formData.framework}
            onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
            placeholder="e.g., React, Vue, Django"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={formData.difficulty} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
          placeholder="Resource author"
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File Upload (Optional)</CardTitle>
          <CardDescription>
            Upload PDF or video files to Supabase Storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop a file here, or click to select
              </p>
              <input
                type="file"
                accept=".pdf,.mp4,.webm,.ogg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Select File'}
              </Button>
            </div>
            
            {uploadedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getTypeIcon(formData.type)}
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (resource ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}
