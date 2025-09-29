import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, ExternalLink, FileText, Video, Book, File } from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase';
import { SupabaseService } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';
import { ResourceForm } from '@/components/ResourceForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Resource = Database['public']['Tables']['resources']['Row'];

export function MyResources() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  const loadResources = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await SupabaseService.getUserResources(user.id, {
        page: 1,
        pageSize: 100, // Load all user resources for now
      });
      setResources(result.items);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [user]);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || resource.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (resource: Resource) => {
    if (!user) return;
    
    try {
      await SupabaseService.deleteResource(resource.id, user.id);
      setResources(resources.filter(r => r.id !== resource.id));
      setDeletingResource(null);
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = (resource: Resource) => {
    if (editingResource) {
      setResources(resources.map(r => r.id === resource.id ? resource : r));
    } else {
      setResources([resource, ...resources]);
    }
    setShowForm(false);
    setEditingResource(null);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'book': return 'bg-blue-100 text-blue-800';
      case 'doc': return 'bg-green-100 text-green-800';
      case 'pdf': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your resources...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Resources</h1>
          <p className="text-muted-foreground">Manage your learning resources</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="book">Book</SelectItem>
            <SelectItem value="doc">Documentation</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="article">Article</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {resources.length === 0 ? (
              <>
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No resources yet</p>
                <p>Start by adding your first resource!</p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No resources found</p>
                <p>Try adjusting your search or filters</p>
              </>
            )}
          </div>
          {resources.length === 0 && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Resource
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-3">
                      {resource.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingResource(resource)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingResource(resource)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className={getTypeColor(resource.type)}>
                    <span className="flex items-center gap-1">
                      {getTypeIcon(resource.type)}
                      {resource.type}
                    </span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resource.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                </div>
                {resource.author && (
                  <p className="text-sm text-muted-foreground mt-2">
                    by {resource.author}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{resource.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resource Form Dialog */}
      <Dialog open={showForm || !!editingResource} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingResource(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </DialogTitle>
            <DialogDescription>
              {editingResource 
                ? 'Update your resource information' 
                : 'Add a new learning resource to your collection'
              }
            </DialogDescription>
          </DialogHeader>
          <ResourceForm
            resource={editingResource}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingResource(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingResource} onOpenChange={(open) => {
        if (!open) setDeletingResource(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingResource?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingResource && handleDelete(deletingResource)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
