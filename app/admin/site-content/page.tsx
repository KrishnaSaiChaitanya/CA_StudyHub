"use client"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

export default function SiteContentAdmin() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contents, setContents] = useState<any>({});

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const contentsMap = data.reduce((acc: any, item: any) => {
        acc[item.page_id] = item.content;
        return acc;
      }, {});
      setContents(contentsMap);
    }
    setLoading(false);
  };

  const handleSave = async (pageId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_content')
      .upsert({ page_id: pageId, content: contents[pageId] }, { onConflict: 'page_id' });

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: `${pageId} content updated successfully.` });
    }
    setSaving(false);
  };

  const updateContent = (pageId: string, field: string, value: any) => {
    setContents((prev: any) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [field]: value
      }
    }));
  };

  const updateArrayItem = (pageId: string, field: string, index: number, itemField: string, value: any) => {
    const newArray = [...contents[pageId][field]];
    newArray[index] = { ...newArray[index], [itemField]: value };
    updateContent(pageId, field, newArray);
  };

  const addArrayItem = (pageId: string, field: string, template: any) => {
    setContents((prev: any) => {
      const pageContent = prev[pageId] || {};
      const fieldArray = pageContent[field] || [];
      return {
        ...prev,
        [pageId]: {
          ...pageContent,
          [field]: [...fieldArray, template]
        }
      };
    });
  };

  const removeArrayItem = (pageId: string, field: string, index: number) => {
    const newArray = [...contents[pageId][field]];
    newArray.splice(index, 1);
    updateContent(pageId, field, newArray);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Content Management</h1>
        <p className="text-muted-foreground">Manage the content of static pages like Help Center, Terms, and Privacy Policy.</p>
      </div>

      <Tabs defaultValue="help-center" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="help-center">Help Center</TabsTrigger>
          <TabsTrigger value="contact-us">Contact Us</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="privacy-policy">Privacy</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* HELP CENTER */}
        <TabsContent value="help-center" className="space-y-4 py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>FAQs</CardTitle>
              <Button onClick={() => handleSave('help-center')} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {contents['help-center']?.faqs?.map((faq: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/20 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeArrayItem('help-center', 'faqs', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Input 
                      value={faq.question} 
                      onChange={(e) => updateArrayItem('help-center', 'faqs', index, 'question', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <Textarea 
                      value={faq.answer} 
                      onChange={(e) => updateArrayItem('help-center', 'faqs', index, 'answer', e.target.value)} 
                    />
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full border-dashed" 
                onClick={() => addArrayItem('help-center', 'faqs', { question: "", answer: "" })}
              >
                <Plus className="h-4 w-4 mr-2" /> Add FAQ
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTACT US */}
        <TabsContent value="contact-us" className="space-y-4 py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contact Information</CardTitle>
              <Button onClick={() => handleSave('contact-us')} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input 
                  value={contents['contact-us']?.email} 
                  onChange={(e) => updateContent('contact-us', 'email', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={contents['contact-us']?.phone} 
                  onChange={(e) => updateContent('contact-us', 'phone', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Physical Address</Label>
                <Textarea 
                  value={contents['contact-us']?.address} 
                  onChange={(e) => updateContent('contact-us', 'address', e.target.value)} 
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TERMS */}
        <TabsContent value="terms" className="space-y-4 py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Terms of Service</CardTitle>
              <Button onClick={() => handleSave('terms')} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Last Updated Date</Label>
                  <Input 
                    value={contents['terms']?.last_updated} 
                    onChange={(e) => updateContent('terms', 'last_updated', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Legal Contact Email</Label>
                  <Input 
                    value={contents['terms']?.contact_email} 
                    onChange={(e) => updateContent('terms', 'contact_email', e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Introduction Text</Label>
                <Textarea 
                  value={contents['terms']?.intro} 
                  onChange={(e) => updateContent('terms', 'intro', e.target.value)} 
                />
              </div>
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Sections</Label>
                {contents['terms']?.sections?.map((section: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/20 relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeArrayItem('terms', 'sections', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input 
                          value={section.title} 
                          onChange={(e) => updateArrayItem('terms', 'sections', index, 'title', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon Name (Lucide)</Label>
                        <Input 
                          value={section.icon} 
                          onChange={(e) => updateArrayItem('terms', 'sections', index, 'icon', e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea 
                        value={section.content} 
                        onChange={(e) => updateArrayItem('terms', 'sections', index, 'content', e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed" 
                  onClick={() => addArrayItem('terms', 'sections', { title: "", content: "", icon: "CheckCircle" })}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Section
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Changes Notification Content</Label>
                <Textarea 
                  value={contents['terms']?.changes_content} 
                  onChange={(e) => updateContent('terms', 'changes_content', e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACY POLICY */}
        <TabsContent value="privacy-policy" className="space-y-4 py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Privacy Policy</CardTitle>
              <Button onClick={() => handleSave('privacy-policy')} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Last Updated Date</Label>
                  <Input 
                    value={contents['privacy-policy']?.last_updated} 
                    onChange={(e) => updateContent('privacy-policy', 'last_updated', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Privacy Contact Email</Label>
                  <Input 
                    value={contents['privacy-policy']?.questions_contact_email} 
                    onChange={(e) => updateContent('privacy-policy', 'questions_contact_email', e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Introduction Text</Label>
                <Textarea 
                  value={contents['privacy-policy']?.intro} 
                  onChange={(e) => updateContent('privacy-policy', 'intro', e.target.value)} 
                />
              </div>
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Sections</Label>
                {contents['privacy-policy']?.sections?.map((section: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/20 relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeArrayItem('privacy-policy', 'sections', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input 
                          value={section.title} 
                          onChange={(e) => updateArrayItem('privacy-policy', 'sections', index, 'title', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon Name (Lucide)</Label>
                        <Input 
                          value={section.icon} 
                          onChange={(e) => updateArrayItem('privacy-policy', 'sections', index, 'icon', e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea 
                        value={section.content} 
                        onChange={(e) => updateArrayItem('privacy-policy', 'sections', index, 'content', e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed" 
                  onClick={() => addArrayItem('privacy-policy', 'sections', { title: "", content: "", icon: "Shield" })}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOOTER SOCIAL LINKS */}
        <TabsContent value="footer" className="space-y-4 py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Footer Social Links</CardTitle>
              <Button onClick={() => handleSave('footer')} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook URL</Label>
                <Input 
                  value={contents['footer']?.facebook || ""} 
                  onChange={(e) => updateContent('footer', 'facebook', e.target.value)} 
                  placeholder="https://facebook.com/your-page"
                />
              </div>
              <div className="space-y-2">
                <Label>Twitter (X) URL</Label>
                <Input 
                  value={contents['footer']?.twitter || ""} 
                  onChange={(e) => updateContent('footer', 'twitter', e.target.value)} 
                  placeholder="https://x.com/your-handle"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input 
                  value={contents['footer']?.instagram || ""} 
                  onChange={(e) => updateContent('footer', 'instagram', e.target.value)} 
                  placeholder="https://instagram.com/your-profile"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input 
                  value={contents['footer']?.linkedin || ""} 
                  onChange={(e) => updateContent('footer', 'linkedin', e.target.value)} 
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input 
                  value={contents['footer']?.youtube || ""} 
                  onChange={(e) => updateContent('footer', 'youtube', e.target.value)} 
                  placeholder="https://youtube.com/c/your-channel"
                />
              </div>
              <div className="space-y-2">
                <Label>Telegram Link</Label>
                <Input 
                  value={contents['footer']?.telegram || ""} 
                  onChange={(e) => updateContent('footer', 'telegram', e.target.value)} 
                  placeholder="https://t.me/your-channel"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Link</Label>
                <Input 
                  value={contents['footer']?.whatsapp || ""} 
                  onChange={(e) => updateContent('footer', 'whatsapp', e.target.value)} 
                  placeholder="https://wa.me/your-number"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
