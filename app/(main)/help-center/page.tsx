"use client"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

const HelpCenter = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('page_id', 'help-center')
        .single();
      
      if (!error && data?.content?.faqs) {
        setFaqs(data.content.faqs);
      }
      setLoading(false);
    };

    fetchFaqs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-accent/10 mb-4">
              <HelpCircle className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Help Center</h1>
            <p className="text-muted-foreground">Find answers to frequently asked questions about CA StudyHub.</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {faqs.map((faq, index) => (
                <Card key={index} className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;
