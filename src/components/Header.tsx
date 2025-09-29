import { Button } from "@/components/ui/button";
import { Moon, Sun, Github, Upload, User, Menu, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-supabase";
import { AuthModal } from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onNavigate?: (section: string) => void;
}

export const Header = ({ onNavigate }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DR</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DevResourceHub
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Find tutorials faster, code more
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => onNavigate?.('browse')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse
          </button>
          <button 
            onClick={() => onNavigate?.('categories')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Categories
          </button>
          <button 
            onClick={() => onNavigate?.('popular')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Popular
          </button>
          <button 
            onClick={() => onNavigate?.('latest')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Latest
          </button>
          {user && (
            <a 
              href="/my-resources"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              My Resources
            </a>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-9 h-9 p-0 rounded-md">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="p-0">
                <SheetHeader className="px-4 pt-4 pb-2">
                  <SheetTitle>DevResourceHub</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="justify-start" onClick={() => onNavigate?.('browse')}>Browse</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => onNavigate?.('categories')}>Categories</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => onNavigate?.('popular')}>Popular</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => onNavigate?.('latest')}>Latest</Button>
                    {user && (
                      <Button variant="ghost" className="justify-start" onClick={() => window.location.href = '/my-resources'}>My Resources</Button>
                    )}
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        toast({
                          title: "Coming soon",
                          description: "Add Resource is not implemented yet.",
                        })
                      }
                    >
                      <Upload className="h-4 w-4" />
                      Add Resource
                    </Button>
                    {user ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <User className="h-4 w-4" />
                            {user.email}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <AuthModal>
                        <Button variant="outline" size="sm" className="gap-2">
                          <User className="h-4 w-4" />
                          Sign In
                        </Button>
                      </AuthModal>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 p-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hidden sm:flex"
            onClick={() =>
              toast({
                title: "Coming soon",
                description: "Add Resource is not implemented yet.",
              })
            }
          >
            <Upload className="h-4 w-4" />
            <span className="hidden md:inline">Add Resource</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthModal>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Sign In</span>
              </Button>
            </AuthModal>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0"
            onClick={() => window.open("https://github.com/", "_blank")}
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </Button>
        </div>
      </div>
    </header>
  );
};