import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function FAQ() {
  const faqs = [
    {
      q: "What is DevResourceHub?",
      a: "DevResourceHub helps developers discover curated tutorials, docs, videos, and guides faster.",
    },
    {
      q: "How do you gather resources?",
      a: "We aggregate from trusted public sources (e.g., DEV, YouTube, Google Books) and normalize them for quick filtering.",
    },
    {
      q: "Is it free to use?",
      a: "Yes. Browsing is free. Some third‑party resources may require accounts or subscriptions.",
    },
    {
      q: "Can I suggest resources?",
      a: "Yes—use the Add Resource button (coming soon) or contact us from the footer.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 px-4 text-center overflow-hidden">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Frequently Asked Questions</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Answers to common questions. Can’t find what you need? Ask us directly.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-md">Ask a question</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ask a question</DialogTitle>
                  </DialogHeader>
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget as HTMLFormElement;
                      const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value || "";
                      const message = (form.querySelector('textarea[name="message"]') as HTMLTextAreaElement)?.value || "";
                      toast({ title: "Question sent", description: `Thanks! We'll reply to ${email}.` });
                      form.reset();
                    }}
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input name="email" type="email" required className="w-full rounded-md border px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Your question</label>
                      <textarea name="message" required className="w-full rounded-md border px-3 py-2 text-sm h-28" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit">Send</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <a href="#faqs" className="text-sm text-primary hover:underline">Jump to questions</a>
            </div>
          </div>
        </section>

        {/* Accordion */}
        <section id="faqs" className="container mx-auto px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-base md:text-lg">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
