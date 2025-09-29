import { Github, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-background/60 backdrop-blur">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">About</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              DevResourceHub helps developers discover curated tutorials, docs, videos, and guides faster, so you can spend more time building.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-foreground transition-colors" to="/">Tutorials</Link></li>
              <li><Link className="hover:text-foreground transition-colors" to="/">Documentation</Link></li>
              <li><Link className="hover:text-foreground transition-colors" to="/">Videos</Link></li>
              <li><Link className="hover:text-foreground transition-colors" to="/">Categories</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-foreground transition-colors" to="/faq">FAQ</Link></li>
              <li><Link className="hover:text-foreground transition-colors" to="/contact">Contact</Link></li>
              <li><Link className="hover:text-foreground transition-colors" to="/">Docs</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Newsletter</h3>
            <p className="mt-3 text-sm text-muted-foreground">Get occasional updates about new curated resources.</p>
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.querySelector('input[type="email"]') as HTMLInputElement | null;
                const email = input?.value || "";
                toast({ title: "Subscribed", description: `We'll email updates to ${email}` });
                if (input) input.value = "";
              }}
            >
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow hover:opacity-90 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DevResourceHub. All rights reserved.</p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <button
              className="w-9 h-9 rounded-md border hover:text-foreground hover:bg-muted transition flex items-center justify-center"
              onClick={() => window.open("https://github.com/", "_blank")}
            >
              <Github className="h-4 w-4" />
            </button>
            <button
              className="w-9 h-9 rounded-md border hover:text-foreground hover:bg-muted transition flex items-center justify-center"
              onClick={() => window.open("https://twitter.com/", "_blank")}
            >
              <Twitter className="h-4 w-4" />
            </button>
            <button
              className="w-9 h-9 rounded-md border hover:text-foreground hover:bg-muted transition flex items-center justify-center"
              onClick={() => window.open("https://www.linkedin.com/", "_blank")}
            >
              <Linkedin className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
