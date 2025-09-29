import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, FileText, Play, File, Heart } from "lucide-react";
import { useState } from "react";

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "video" | "book" | "doc" | "pdf" | "article" | string;
  language: string;
  framework?: string;
  difficulty: "beginner" | "intermediate" | "advanced" | string;
  tags: string[];
  author?: string;
  rating?: number;
  bookmarked?: boolean;
}

interface ResourceCardProps {
  resource: Resource;
  onBookmark?: (resourceId: string) => void;
}

const getResourceIcon = (type: Resource["type"]) => {
  switch (type) {
    case "video":
      return <Play className="h-4 w-4" />;
    case "book":
      return <BookOpen className="h-4 w-4" />;
    case "doc":
      return <FileText className="h-4 w-4" />;
    case "pdf":
      return <File className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getResourceBadgeClass = (type: Resource["type"]) => {
  switch (type) {
    case "video":
      return "resource-badge-video";
    case "book":
      return "resource-badge-book";
    case "doc":
      return "resource-badge-doc";
    case "pdf":
      return "resource-badge-pdf";
    default:
      return "resource-badge-doc";
  }
};

const getDifficultyColor = (difficulty: Resource["difficulty"]) => {
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "advanced":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export const ResourceCard = ({ resource, onBookmark }: ResourceCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(resource.bookmarked || false);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(resource.id);
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer"
      onClick={() => window.open(resource.url, '_blank')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(resource.url, '_blank');
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getResourceBadgeClass(resource.type)}`}>
              {getResourceIcon(resource.type)}
              {resource.type.toUpperCase()}
            </div>
            <Badge variant="outline" className={getDifficultyColor(resource.difficulty)}>
              {resource.difficulty}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
            className={`p-2 transition-colors ${
              isBookmarked 
                ? "text-red-500 hover:text-red-600" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>
        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {resource.title}
        </h3>
        {resource.author && (
          <p className="text-sm text-muted-foreground">by {resource.author}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {resource.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {resource.language}
          </Badge>
          {resource.framework && (
            <Badge variant="secondary" className="text-xs">
              {resource.framework}
            </Badge>
          )}
          {resource.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {resource.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{resource.tags.length - 2} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {resource.rating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="text-yellow-500">★</span>
              <span>{resource.rating.toFixed(1)}</span>
            </div>
          )}
          <Button 
            variant="default" 
            size="sm" 
            className="ml-auto"
            onClick={(e) => { e.stopPropagation(); window.open(resource.url, '_blank'); }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Resource
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};