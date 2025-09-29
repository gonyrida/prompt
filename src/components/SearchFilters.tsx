import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { useState } from "react";

export interface SearchFilters {
  query: string;
  type: string;
  language: string;
  framework: string;
  difficulty: string;
  tags: string[];
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

const resourceTypes = [
  { value: "all", label: "All Types" },
  { value: "video", label: "Videos" },
  { value: "book", label: "Books" },
  { value: "doc", label: "Documentation" },
  { value: "pdf", label: "PDFs" },
  { value: "article", label: "Articles" },
];

const languages = [
  { value: "all", label: "All Languages" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
];

const frameworks = [
  { value: "all", label: "All Frameworks" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "nodejs", label: "Node.js" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "spring", label: "Spring" },
  { value: "express", label: "Express" },
];

const difficulties = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const popularTags = [
  "API", "Database", "Authentication", "Frontend", "Backend", "Mobile", 
  "DevOps", "Testing", "Security", "Performance", "UI/UX", "Machine Learning"
];

export const SearchFilters = ({ filters, onFiltersChange, onSearch }: SearchFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilters("tags", [...filters.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    updateFilters("tags", filters.tags.filter(t => t !== tag));
  };

  const clearFilters = () => {
    onFiltersChange({
      query: "",
      type: "all",
      language: "all",
      framework: "all",
      difficulty: "all",
      tags: [],
    });
  };

  const hasActiveFilters = (filters.type && filters.type !== "all") || 
                          (filters.language && filters.language !== "all") || 
                          (filters.framework && filters.framework !== "all") || 
                          (filters.difficulty && filters.difficulty !== "all") || 
                          filters.tags.length > 0;

  return (
    <div className="space-y-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
      {/* Main Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Search Resources
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="search"
            placeholder="Search tutorials, guides, documentation..."
            value={filters.query}
            onChange={(e) => updateFilters("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.type} onValueChange={(value) => updateFilters("type", value)}>
          <SelectTrigger className="w-auto min-w-[120px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.language} onValueChange={(value) => updateFilters("language", value)}>
          <SelectTrigger className="w-auto min-w-[120px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.difficulty} onValueChange={(value) => updateFilters("difficulty", value)}>
          <SelectTrigger className="w-auto min-w-[120px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            {difficulties.map((diff) => (
              <SelectItem key={diff.value} value={diff.value}>
                {diff.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Advanced
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Framework</Label>
            <Select value={filters.framework} onValueChange={(value) => updateFilters("framework", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((framework) => (
                  <SelectItem key={framework.value} value={framework.value}>
                    {framework.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Tags</Label>
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {popularTags
                .filter(tag => !filters.tags.includes(tag))
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addTag(tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Button */}
      <div className="pt-2">
        <Button onClick={onSearch} className="w-full h-12 text-base font-medium">
          <Search className="h-4 w-4 mr-2" />
          Search Resources
        </Button>
      </div>
    </div>
  );
};