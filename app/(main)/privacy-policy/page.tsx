"use client"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

const PrivacyPolicy = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('page_id', 'privacy-policy')
        .single();
      
      if (!error && data?.content) {
        setContent(data.content);
      }
      setLoading(false);
    };

    fetchContent();
  }, []);

  const IconComponent = ({ name, className }: { name: string; className?: string }) => {
    const Icon = (LucideIcons as any)[name] || LucideIcons.Shield;
    return <Icon className={className} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const { last_updated, intro, sections = [], questions_contact_email } = content || {};

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
              <LucideIcons.Shield className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {last_updated}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-sm max-w-none text-muted-foreground mb-8"
          >
            <div className="whitespace-pre-wrap leading-relaxed">{intro}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {sections.map((section: any, index: number) => (
              <Card key={index} className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconComponent name={section.icon} className="h-5 w-5 text-accent" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 rounded-xl bg-muted/50 border border-border/60"
          >
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Questions?</strong> If you have any questions about 
              this Privacy Policy, please contact us at{" "}
              <a href={`mailto:${questions_contact_email}`} className="text-accent hover:underline">
                {questions_contact_email}
              </a>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
