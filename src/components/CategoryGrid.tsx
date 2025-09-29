import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Database, 
  Smartphone, 
  Cloud, 
  Shield, 
  Palette, 
  Brain, 
  Zap,
  Globe,
  Terminal,
  Layers,
  Settings
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  resourceCount: number;
  color: string;
}

const categories: Category[] = [
  {
    id: "frontend",
    name: "Frontend Development",
    description: "React, Vue, Angular, HTML, CSS",
    icon: <Code className="h-6 w-6" />,
    resourceCount: 1243,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "backend",
    name: "Backend Development",
    description: "Node.js, Python, Java, APIs",
    icon: <Terminal className="h-6 w-6" />,
    resourceCount: 892,
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    id: "database",
    name: "Databases",
    description: "SQL, NoSQL, PostgreSQL, MongoDB",
    icon: <Database className="h-6 w-6" />,
    resourceCount: 567,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "mobile",
    name: "Mobile Development",
    description: "React Native, Flutter, iOS, Android",
    icon: <Smartphone className="h-6 w-6" />,
    resourceCount: 334,
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    id: "devops",
    name: "DevOps & Cloud",
    description: "Docker, Kubernetes, AWS, CI/CD",
    icon: <Cloud className="h-6 w-6" />,
    resourceCount: 445,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    id: "security",
    name: "Security",
    description: "Cybersecurity, Auth, Encryption",
    icon: <Shield className="h-6 w-6" />,
    resourceCount: 223,
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    id: "design",
    name: "UI/UX Design",
    description: "Figma, Design Systems, UX",
    icon: <Palette className="h-6 w-6" />,
    resourceCount: 189,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "ai-ml",
    name: "AI & Machine Learning",
    description: "Python, TensorFlow, PyTorch",
    icon: <Brain className="h-6 w-6" />,
    resourceCount: 378,
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "web3",
    name: "Web3 & Blockchain",
    description: "Solidity, Ethereum, DeFi",
    icon: <Layers className="h-6 w-6" />,
    resourceCount: 156,
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "performance",
    name: "Performance",
    description: "Optimization, Monitoring, Speed",
    icon: <Zap className="h-6 w-6" />,
    resourceCount: 267,
    color: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
  },
  {
    id: "apis",
    name: "APIs & Integration",
    description: "REST, GraphQL, WebSockets",
    icon: <Globe className="h-6 w-6" />,
    resourceCount: 423,
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    id: "tools",
    name: "Development Tools",
    description: "Git, VSCode, Testing, Debugging",
    icon: <Settings className="h-6 w-6" />,
    resourceCount: 512,
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
];

interface CategoryGridProps {
  onCategorySelect?: (categoryId: string) => void;
  itemsPerPage?: number;
}

export const CategoryGrid = ({ onCategorySelect, itemsPerPage = 20 }: CategoryGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = categories.slice(startIndex, endIndex);
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Browse by Category</h2>
        <p className="text-muted-foreground">
          Discover resources organized by technology and skill area
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentCategories.map((category) => (
          <Card
            key={category.id}
            className="group cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm border-border/50"
            onClick={() => onCategorySelect?.(category.id)}
          >
            <CardContent className="p-6 space-y-3">
              <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {category.icon}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              </div>
              
              <div className="pt-2">
                <Badge variant="secondary" className="text-xs">
                  {category.resourceCount.toLocaleString()} resources
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-9 h-9 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};