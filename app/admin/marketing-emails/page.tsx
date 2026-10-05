"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AuthGuard } from "@/components/admin/auth-guard";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCanManageMarketing } from "@/lib/rbacConfig";
import {
  marketingTemplatesApi,
  MarketingEmailTemplate,
} from "@/lib/api/marketingTemplates";
import {
  Mail,
  Send,
  Eye,
  Code,
  Sparkles,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Info,
  ChevronDown,
  Layers,
  Search,
} from "lucide-react";

const SAMPLE_VARIABLES: Record<string, string> = {
  "{{firstName}}": "Alex",
  "{{seekerName}}": "Alex Morgan",
  "{{providerName}}": "Acme Talent Corp",
  "{{companyName}}": "TechVision AI",
  "{{jobTitle}}": "Senior Full Stack Engineer",
  "{{profileCompletion}}": "45%",
  "{{interviewDate}}": "Monday, Oct 12, 2026",
  "{{interviewTime}}": "10:30 AM EST",
  "{{profileUrl}}": "https://app.hirenest.ai/profile",
  "{{ctaUrl}}": "https://app.hirenest.ai",
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  all: { label: "All Templates", icon: "📬" },
  onboarding_drip: { label: "Incomplete Profile Drips", icon: "🚀" },
  resume_nudge: { label: "Resume Nudges", icon: "📄" },
  application_followup: { label: "Application Lifecycle", icon: "🎯" },
  employer_drip: { label: "Employer Workflows", icon: "🏢" },
  custom: { label: "System & Auth", icon: "🔒" },
};

export default function MarketingEmailsPage() {
  const { toast } = useToast();
  const canManage = useCanManageMarketing();

  const [templates, setTemplates] = useState<MarketingEmailTemplate[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"edit" | "preview">("edit");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Form State for Selected Template
  const [formData, setFormData] = useState<Partial<MarketingEmailTemplate>>({});
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  // Test Email Dialog State
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testEmailAddress, setTestEmailAddress] = useState<string>("");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  // Load Templates
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await marketingTemplatesApi.getAll();
      if (res.success && res.templates) {
        setTemplates(res.templates);
        if (res.templates.length > 0 && !selectedSlug) {
          selectTemplate(res.templates[0]);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error loading templates",
        description: err.message || "Could not fetch email templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const selectTemplate = (tpl: MarketingEmailTemplate) => {
    setSelectedSlug(tpl.slug);
    setFormData({
      name: tpl.name,
      slug: tpl.slug,
      triggerDescription: tpl.triggerDescription || "",
      category: tpl.category,
      targetRole: tpl.targetRole,
      subject: tpl.subject,
      preheader: tpl.preheader || "",
      bodyHtml: tpl.bodyHtml,
      ctaText: tpl.ctaText || "",
      ctaUrl: tpl.ctaUrl || "",
      delayHours: tpl.delayHours ?? 0,
      isActive: tpl.isActive ?? true,
      tags: tpl.tags || [],
    });
  };

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.slug === selectedSlug) || null;
  }, [templates, selectedSlug]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
      const matchesSearch =
        !searchFilter ||
        t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (t.triggerDescription && t.triggerDescription.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchFilter]);

  const handleCopyVariable = (varName: string) => {
    navigator.clipboard.writeText(varName);
    setCopiedVariable(varName);
    setTimeout(() => setCopiedVariable(null), 1500);
    toast({
      title: "Copied variable",
      description: `${varName} copied to clipboard.`,
    });
  };

  const handleSave = async () => {
    if (!selectedSlug) return;
    if (!formData.subject?.trim() || !formData.bodyHtml?.trim()) {
      toast({
        title: "Missing required fields",
        description: "Subject and body content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await marketingTemplatesApi.update(selectedSlug, formData);
      if (res.success && res.template) {
        toast({
          title: "Template Saved",
          description: `"${res.template.name}" has been updated successfully.`,
        });
        setTemplates((prev) =>
          prev.map((t) => (t.slug === selectedSlug ? { ...t, ...res.template } : t))
        );
      }
    } catch (err: any) {
      toast({
        title: "Failed to save template",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset all 15 email templates to default values?")) return;
    setIsLoading(true);
    try {
      const res = await marketingTemplatesApi.resetDefaults();
      if (res.success && res.templates) {
        setTemplates(res.templates);
        if (res.templates.length > 0) {
          selectTemplate(res.templates[0]);
        }
        toast({
          title: "Templates Reset",
          description: "All templates have been reset to factory defaults.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Reset Failed",
        description: err.message || "Could not reset templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid recipient email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await marketingTemplatesApi.sendTestEmail({
        toEmail: testEmailAddress,
        subject: formData.subject || "Test Email",
        preheader: formData.preheader || "",
        bodyHtml: formData.bodyHtml || "",
        ctaText: formData.ctaText || "View Details",
        ctaUrl: formData.ctaUrl || "https://app.hirenest.ai",
      });

      if (res.success) {
        toast({
          title: "Test Email Delivered 🚀",
          description: `Check your inbox at ${testEmailAddress}. Sent via verified Resend domain.`,
        });
        setIsTestModalOpen(false);
      } else {
        throw new Error(res.message || "Sending failed");
      }
    } catch (err: any) {
      toast({
        title: "Delivery Failed",
        description: err.message || "Could not send test email.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Compile Preview HTML
  const compiledPreviewHtml = useMemo(() => {
    let rawBody = formData.bodyHtml || "";
    let rawSubject = formData.subject || "";
    let rawPreheader = formData.preheader || "";
    let rawCtaText = formData.ctaText || "";
    let rawCtaUrl = formData.ctaUrl || "https://app.hirenest.ai";

    for (const [key, val] of Object.entries(SAMPLE_VARIABLES)) {
      const regex = new RegExp(key.replace(/([{}])/g, "\\$1"), "g");
      rawBody = rawBody.replace(regex, val);
      rawSubject = rawSubject.replace(regex, val);
      rawPreheader = rawPreheader.replace(regex, val);
      rawCtaText = rawCtaText.replace(regex, val);
      rawCtaUrl = rawCtaUrl.replace(regex, val);
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a, #2563eb);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            background: #ffffff;
            padding: 36px 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 24px 0 12px 0;
            font-weight: 600;
            font-size: 15px;
            text-align: center;
          }
          .footer {
            text-align: center;
            padding: 24px;
            font-size: 12px;
            color: #6b7280;
          }
          .footer a {
            color: #6b7280;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HireNest</h1>
        </div>
        <div class="content">
          ${rawBody}
          ${
            rawCtaText && rawCtaUrl
              ? `<div style="text-align: center; margin-top: 28px;">
                  <a href="${rawCtaUrl}" target="_blank" class="cta-button">${rawCtaText}</a>
                </div>`
              : ""
          }
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} HireNest.ai — Autonomous AI Talent & Career Platform.</p>
          <p>You received this email because you created an account on hirenest.ai.</p>
          <p><a href="https://app.hirenest.ai/jobseeker/notifications" target="_blank" style="color: #6b7280; text-decoration: underline;">Manage email preferences or unsubscribe</a></p>
        </div>
        <script>
          // Prevent any link from navigating inside the preview iframe
          document.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (link) {
              e.preventDefault();
              e.stopPropagation();
              var href = link.getAttribute('href') || '';
              var toast = document.getElementById('preview-link-toast');
              if (!toast) {
                toast = document.createElement('div');
                toast.id = 'preview-link-toast';
                toast.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0f172a;color:#ffffff;padding:8px 16px;border-radius:999px;font-size:11px;font-weight:600;font-family:-apple-system,sans-serif;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:99999;pointer-events:none;transition:opacity 0.2s ease;';
                document.body.appendChild(toast);
              }
              toast.innerText = '🔗 Link in Live Email: ' + (href.length > 40 ? href.substring(0, 37) + '...' : href);
              toast.style.opacity = '1';
              clearTimeout(window.__toastTimer);
              window.__toastTimer = setTimeout(function() { toast.style.opacity = '0'; }, 2200);
              return false;
            }
          }, true);
        </script>
      </body>
      </html>
    `;
  }, [formData]);

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Emails"
            description="View, customize, and live-test every single automated email sent across HireNest — from transactional alerts to smart profile completion drips."
            action={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleResetDefaults} disabled={isLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset 15 Defaults
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsTestModalOpen(true)}
                  disabled={!selectedSlug || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="mr-2 h-4 w-4" /> Send Test to Inbox
                </Button>
              </div>
            }
          />

          {/* Quick Dropdown Selector for All Templates */}
          <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="template-dropdown" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Any Platform Template to Edit & Test
                  </Label>
                  <div className="relative mt-1">
                    <select
                      id="template-dropdown"
                      value={selectedSlug}
                      onChange={(e) => {
                        const target = templates.find((t) => t.slug === e.target.value);
                        if (target) selectTemplate(target);
                      }}
                      className="w-full md:w-[380px] bg-background border border-input rounded-md px-3 py-2 text-sm font-semibold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer pr-8"
                    >
                      {templates.map((tpl) => (
                        <option key={tpl.slug} value={tpl.slug}>
                          [{tpl.targetRole.toUpperCase()}] {tpl.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-2.5 top-3 pointer-events-none opacity-50" />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-[260px]">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search templates or triggers..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 text-xs bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto p-1 gap-1">
              {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => (
                <TabsTrigger key={catKey} value={catKey} className="text-xs py-2">
                  <span className="mr-1.5">{catInfo.icon}</span> {catInfo.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Master-Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Template List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Templates ({filteredTemplates.length})
                </span>
                <span className="text-xs text-muted-foreground">Click to edit</span>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No templates found matching your criteria.</p>
                </Card>
              ) : (
                <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                  {filteredTemplates.map((tpl) => {
                    const isSelected = tpl.slug === selectedSlug;
                    return (
                      <Card
                        key={tpl.slug}
                        onClick={() => selectTemplate(tpl)}
                        className={`cursor-pointer transition-all duration-150 hover:border-primary/50 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                            : "border-border/60 hover:bg-muted/30"
                        }`}
                      >
                        <CardContent className="p-3.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-xs leading-snug line-clamp-1">{tpl.name}</h4>
                            <Badge
                              variant={tpl.isActive ? "default" : "secondary"}
                              className="text-[9px] uppercase font-bold shrink-0 px-1.5 py-0"
                            >
                              {tpl.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>

                          {tpl.triggerDescription && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                              ⚡ {tpl.triggerDescription}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              {tpl.slug}
                            </span>
                            <span className="capitalize font-medium text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              {tpl.targetRole}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Studio Editor & Preview */}
            <div className="lg:col-span-8">
              {selectedTemplate ? (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b pb-4">
                    {/* Highlighted Trigger Banner */}
                    <div className="rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 mb-3">
                      <div className="flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                            When this email is sent:
                          </span>
                          <p className="text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed font-medium">
                            {formData.triggerDescription || "Sent automatically based on platform events and milestones."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Quick Live Email Tester */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3.5 mb-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                              Direct Inbox Tester (Resend API)
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-background text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono">
                              Verified: hirenest.ai
                            </Badge>
                          </div>
                          <p className="text-[11.5px] text-muted-foreground">
                            Enter any email address to test send &ldquo;{formData.name}&rdquo; straight to your inbox via Resend.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-[250px]">
                            <Mail className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                            <Input
                              type="email"
                              placeholder="Enter your email ID (e.g. name@gmail.com)"
                              value={testEmailAddress}
                              onChange={(e) => setTestEmailAddress(e.target.value)}
                              className="pl-8 h-8 text-xs bg-background"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendTestEmail();
                              }}
                            />
                          </div>
                          <Button
                            onClick={handleSendTestEmail}
                            disabled={isSendingTest || !testEmailAddress || isLoading}
                            size="sm"
                            className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 shadow-sm"
                          >
                            {isSendingTest ? (
                              <>
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-1.5 h-3.5 w-3.5" /> Send Test Email
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold">{formData.name}</CardTitle>
                          <Badge variant="outline" className="text-xs font-mono">
                            {formData.slug}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-1">
                          Role: <strong className="capitalize">{formData.targetRole}</strong> &bull; Category: <strong className="capitalize">{formData.category?.replace('_', ' ')}</strong>
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="template-active"
                            checked={formData.isActive}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({ ...prev, isActive: checked }))
                            }
                          />
                          <Label htmlFor="template-active" className="text-xs cursor-pointer">
                            {formData.isActive ? "Active" : "Paused"}
                          </Label>
                        </div>

                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          size="sm"
                          className="bg-primary text-primary-foreground font-medium"
                        >
                          {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Changes
                        </Button>
                      </div>
                    </div>

                    {/* Mode Toggle: Edit vs Preview */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="inline-flex rounded-lg border bg-muted p-1 text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => setActiveEditorTab("edit")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            activeEditorTab === "edit"
                              ? "bg-background text-foreground shadow-sm"
                              : "hover:text-foreground"
                          }`}
                        >
                          <Code className="h-3.5 w-3.5" /> Content Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEditorTab("preview")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            activeEditorTab === "preview"
                              ? "bg-background text-foreground shadow-sm"
                              : "hover:text-foreground"
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" /> Live Preview
                        </button>
                      </div>

                      {activeEditorTab === "preview" && (
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-md border text-xs">
                          <button
                            onClick={() => setPreviewDevice("desktop")}
                            className={`p-1 rounded ${
                              previewDevice === "desktop" ? "bg-background text-foreground shadow-sm" : ""
                            }`}
                            title="Desktop View"
                          >
                            <Monitor className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPreviewDevice("mobile")}
                            className={`p-1 rounded ${
                              previewDevice === "mobile" ? "bg-background text-foreground shadow-sm" : ""
                            }`}
                            title="Mobile View"
                          >
                            <Smartphone className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-5">
                    {/* Placeholder Variable Tags */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> Dynamic Variables (Click to copy)
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(SAMPLE_VARIABLES).map((variable) => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => handleCopyVariable(variable)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/80 hover:bg-secondary text-secondary-foreground text-xs font-mono transition-colors border border-border/40"
                          >
                            {variable}
                            {copiedVariable === variable ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-40" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeEditorTab === "edit" ? (
                      <div className="space-y-4">
                        {/* Trigger Description Note */}
                        <div className="space-y-1.5">
                          <Label htmlFor="triggerDesc" className="text-xs font-semibold">
                            When This Email Is Sent (Trigger Note)
                          </Label>
                          <Input
                            id="triggerDesc"
                            value={formData.triggerDescription || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, triggerDescription: e.target.value }))
                            }
                            placeholder="e.g. Sent automatically when a candidate applies..."
                            className="text-xs font-medium"
                          />
                        </div>

                        {/* Subject Line */}
                        <div className="space-y-1.5">
                          <Label htmlFor="subject" className="text-xs font-semibold">
                            Subject Line
                          </Label>
                          <Input
                            id="subject"
                            value={formData.subject || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, subject: e.target.value }))
                            }
                            placeholder="e.g. {{firstName}}, your HireNest profile is 90% ready! 🚀"
                            className="font-medium"
                          />
                        </div>

                        {/* Preheader */}
                        <div className="space-y-1.5">
                          <Label htmlFor="preheader" className="text-xs font-semibold">
                            Preheader (Snippet shown in email preview)
                          </Label>
                          <Input
                            id="preheader"
                            value={formData.preheader || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, preheader: e.target.value }))
                            }
                            placeholder="Brief catchy preview text..."
                          />
                        </div>

                        {/* Body HTML */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="bodyHtml" className="text-xs font-semibold">
                              Email Body (HTML & Variables Supported)
                            </Label>
                            <span className="text-[11px] text-muted-foreground">
                              Wrapped inside HireNest branded email container
                            </span>
                          </div>
                          <Textarea
                            id="bodyHtml"
                            rows={12}
                            value={formData.bodyHtml || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, bodyHtml: e.target.value }))
                            }
                            className="font-mono text-xs leading-relaxed"
                            placeholder="<p>Hi {{firstName}},</p>..."
                          />
                        </div>

                        {/* CTA Button Settings */}
                        <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                🔘 Call-to-Action (CTA) Button
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                Primary Link
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              Renders a high-conversion button in the email body
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="ctaText" className="text-xs font-semibold flex items-center justify-between">
                                <span>CTA Button Text</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Button label</span>
                              </Label>
                              <Input
                                id="ctaText"
                                value={formData.ctaText || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, ctaText: e.target.value }))
                                }
                                placeholder="e.g. Complete My Profile (Takes 90s) →"
                                className="text-xs"
                              />
                              <p className="text-[11px] text-muted-foreground leading-normal">
                                The label on the main action button (e.g. &ldquo;Explore Jobs&rdquo;, &ldquo;Verify Account&rdquo;). Leave empty for no button.
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="ctaUrl" className="text-xs font-semibold flex items-center justify-between">
                                <span>CTA Button URL</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Destination link</span>
                              </Label>
                              <Input
                                id="ctaUrl"
                                value={formData.ctaUrl || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, ctaUrl: e.target.value }))
                                }
                                placeholder="https://app.hirenest.ai/profile"
                                className="text-xs font-mono"
                              />
                              <p className="text-[11px] text-muted-foreground leading-normal">
                                Where users land when clicking the button. Dynamic variables like <code>{"{{ctaUrl}}"}</code> or <code>{"{{profileUrl}}"}</code> are supported.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Trigger Delay Settings */}
                        <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-bold text-foreground">
                                Trigger Delay (Cadence)
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {Number(formData.delayHours || 0) === 0
                                  ? "Instant Alert (0h)"
                                  : `${formData.delayHours} Hours (${Math.round(((formData.delayHours || 0) / 24) * 10) / 10} Days)`}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              Automated delay before dispatch
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="delayHours" className="text-xs font-semibold">
                                Trigger Delay (Hours after milestone)
                              </Label>
                              <Input
                                id="delayHours"
                                type="number"
                                min={0}
                                value={formData.delayHours ?? 0}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    delayHours: Number(e.target.value),
                                  }))
                                }
                                className="text-xs font-mono"
                              />
                              <p className="text-[11px] text-muted-foreground leading-normal">
                                How many hours after the platform event occurs before sending this email.
                              </p>
                            </div>

                            <div className="rounded-lg bg-background/90 border p-2.5 text-xs space-y-1">
                              <p className="font-semibold text-foreground text-[11px]">Common Timing Examples:</p>
                              <div className="text-[11px] text-muted-foreground space-y-0.5">
                                <div>• <code className="font-mono text-[10px]">0 hrs</code>: Instant alert (Applied, Shortlisted, Hired)</div>
                                <div>• <code className="font-mono text-[10px]">24 hrs</code>: Day 1 onboarding incomplete nudge</div>
                                <div>• <code className="font-mono text-[10px]">72 hrs</code>: Day 3 AI resume builder reminder</div>
                                <div>• <code className="font-mono text-[10px]">168 hrs</code>: Day 7 weekly matching job radar</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Live Preview Tab */
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-full transition-all duration-200 border rounded-xl overflow-hidden bg-background shadow-inner ${
                            previewDevice === "mobile" ? "max-w-[390px]" : "max-w-full"
                          }`}
                        >
                          <div className="bg-muted px-4 py-2 border-b flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="font-semibold text-foreground truncate">
                              {formData.subject || "Subject"}
                            </span>
                          </div>
                          <iframe
                            title="Email Preview"
                            srcDoc={compiledPreviewHtml}
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-[540px] border-0 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-12 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-base font-medium">Select a campaign template to begin editing.</p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Send Test Email Modal */}
        <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Send Real-Time Test Email
              </DialogTitle>
              <DialogDescription className="text-xs">
                Send an exact rendered preview of &quot;{formData.name}&quot; to any inbox via HireNest&apos;s verified Resend service.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="test-email" className="text-xs font-semibold">
                  Recipient Email Address (e.g. your Gmail)
                </Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">💡 How testing works:</p>
                <p>
                  Placeholders like <code>{"{{firstName}}"}</code> and <code>{"{{jobTitle}}"}</code> will be substituted with realistic candidate and company data.
                </p>
                <p>Delivered via <code>noreply@hirenest.ai</code> within 2-3 seconds.</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTestModalOpen(false)}
                disabled={isSendingTest}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmailAddress}
                className="bg-primary text-primary-foreground"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Delivering...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Test Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  );
}
