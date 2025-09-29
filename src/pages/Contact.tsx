import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 px-4 text-center overflow-hidden">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Get in touch</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Questions, feedback, or partnership ideas? We’d love to hear from you.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info cards */}
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-background/60">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">support@devresourcehub.app</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-background/60">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-background/60">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Office</p>
                    <p className="text-sm text-muted-foreground">San Francisco, CA</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-background/60">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Community</p>
                    <p className="text-sm text-muted-foreground">Join discussions and share resources</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border p-6 bg-background/60">
                <h2 className="text-xl font-semibold">Send us a message</h2>
                <p className="text-sm text-muted-foreground mt-1">We usually respond within 1–2 business days.</p>
                <form
                  className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const name = (form.querySelector('input[name="name"]') as HTMLInputElement)?.value || "";
                    const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";
                    const subject = (form.querySelector('input[name="subject"]') as HTMLInputElement)?.value || "";
                    const message = (form.querySelector('textarea[name="message"]') as HTMLTextAreaElement)?.value || "";
                    if (!name || !email || !message) return;
                    toast({ title: "Message sent", description: `Thanks ${name}! We'll reply to ${email}.` });
                    form.reset();
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input name="name" className="w-full rounded-md border px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="email" type="email" className="w-full rounded-md border px-3 py-2 text-sm" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <input name="subject" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="How can we help?" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea name="message" className="w-full rounded-md border px-3 py-2 text-sm h-40" required />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">By submitting, you agree to our terms and privacy policy.</div>
                    <Button type="submit" className="rounded-md">Send message</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
