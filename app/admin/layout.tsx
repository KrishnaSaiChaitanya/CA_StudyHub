"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, Users, FileText, LayoutDashboard, Mail, Trophy, 
  CalendarDays, Video, Menu, X, ArrowLeft, Settings, GraduationCap, Megaphone, MessageSquare, Layers
} from "lucide-react";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoElement } from "@/assets/logo";

const navGroups = [
  {
    group: "Overview",
    items: [
      { href: "/admin", exact: true, icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/leaderboard", exact: false, icon: Trophy, label: "Leaderboard Rules" },
      { href: "/admin/contact-us", exact: false, icon: Mail, label: "Contact Us" },
    ]
  },
  {
    group: "Content Management",
    items: [
      { href: "/admin/planners", exact: false, icon: BookOpen, label: "Study Planners" },
      { href: "/admin/tests", exact: false, icon: FileText, label: "Tests & MCQs" },
      { href: "/admin/practice-papers", exact: false, icon: GraduationCap, label: "Practice Papers" },
      { href: "/admin/site-content", exact: false, icon: FileText, label: "Site Content" },
      { href: "/admin/spom", exact: false, icon: BookOpen, label: "SPOM Content" },
      { href: "/admin/flash-cards", exact: false, icon: Layers, label: "Flashcards" },
    ]
  },
  {
    group: "Community & Events",
    items: [
      { href: "/admin/events", exact: false, icon: CalendarDays, label: "Calendar Events" },
      { href: "/admin/exam-dates", exact: false, icon: CalendarDays, label: "Exam Dates" },
      { href: "/admin/community-submissions", exact: false, icon: Users, label: "Submissions" },
      { href: "/admin/faculty", exact: false, icon: Users, label: "Faculty" },
      { href: "/admin/rooms", exact: false, icon: Video, label: "Study Rooms" },
      { href: "/admin/forum-reports", exact: false, icon: Mail, label: "Forum Reports" },
      { href: "/admin/announcements", exact: false, icon: Megaphone, label: "Announcements" },
      { href: "/admin/groups", exact: false, icon: MessageSquare, label: "Forum Groups" },
    ]
  }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className="flex flex-col gap-6 mt-8">
      {navGroups.map((group) => (
        <div key={group.group} className="flex flex-col gap-1">
          <h3 className="px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2">
            {group.group}
          </h3>
          {group.items.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                )}
                
                <item.icon className={cn(
                  "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
                )} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#fcfcfd] dark:bg-background text-foreground">
      
      {/* === Desktop Sidebar === */}
      <aside className="w-64 border-r border-border/60 bg-white dark:bg-card p-6 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 p-1.5 rounded-xl">
            <LogoElement height={32} width={32} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none tracking-tight">CAStudyHub</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Admin Panel</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <NavLinks />
        </div>

        {/* Sidebar Footer Action */}
        <div className="pt-4 mt-4 border-t border-border">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Website
          </Link>
        </div>
      </aside>

      {/* === Mobile Drawer === */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border p-6 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LogoElement height={32} width={32} />
            <h2 className="text-xl font-bold">Admin</h2>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-secondary rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks isMobile />
      </aside>

      {/* === Main Content Area === */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-white dark:bg-card sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <LogoElement height={32} width={32} />
            <span className="font-bold">CAStudyHub Admin</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg bg-secondary">
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-10">
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}