
import type { NavItem, SidebarNavItem } from "@/types";
import { Home, FileText, BarChart3, Library, GraduationCap, UserCircle, Settings, Search, ShieldCheck, FileSignature, History, MessageSquareWarning, ScrollText, ClipboardList, BookOpen, Info, ShieldAlert } from 'lucide-react'; // Added ShieldAlert

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
  mainNav: NavItem[];
  sidebarNav: SidebarNavItem[];
};

export const siteConfig: SiteConfig = {
  name: "KJV Sentinel",
  description:
    "Analyze religious content against the KJV 1611 Bible for theological accuracy, historical context, and Calvinistic influence.",
  url: "https://kjvsentinel.example.com", // Replace with actual URL
  ogImage: "https://kjvsentinel.example.com/og.jpg", // Replace with actual OG image
  links: {
    twitter: "https://twitter.com/kjvsentinel", // Replace
    github: "https://github.com/youruser/kjvsentinel", // Replace
  },
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Analyze Content",
      href: "/analyze",
      icon: Search,
    },
    {
      title: "Content Reports",
      href: "/reports",
      icon: FileText,
    },
    {
      title: "Analyze Teaching",
      href: "/analyze-teaching",
      icon: FileSignature,
    },
    {
      title: "Teaching Reports",
      href: "/teaching-reports",
      icon: History,
    },
    {
      title: "Isms Explained",
      href: "/isms-explained",
      icon: Info,
    },
    {
      title: "Heresies in History",
      href: "/heresies-history",
      icon: ShieldAlert,
    },
    {
      title: "Library",
      href: "/library",
      icon: Library,
    },
    {
      title: "Learning",
      href: "/learning",
      icon: GraduationCap,
    },
    {
      title: "Glossary",
      href: "/glossary",
      icon: BookOpen,
    },
  ],
  sidebarNav: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: Home,
          description: "Main overview and quick actions.",
        },
      ],
    },
    {
      title: "Analysis Tools",
      items: [
        {
          title: "Analyze Content",
          href: "/analyze",
          icon: Search, 
          description: "Submit sermons, articles for theological analysis.",
        },
        {
          title: "Content Reports",
          href: "/reports",
          icon: FileText, 
          description: "View your content analysis reports.",
        },
        {
          title: "Analyze Teaching",
          href: "/analyze-teaching",
          icon: FileSignature, 
          description: "Analyze specific teachings or philosophies.",
        },
        {
          title: "Teaching Reports",
          href: "/teaching-reports",
          icon: History, 
          description: "View your teaching analysis reports.",
        },
      ],
    },
    {
      title: "Knowledge Base", 
      items: [
        {
          title: "Isms Explained",
          href: "/isms-explained",
          icon: Info, 
          description: "Examine 'isms', heresies, and philosophies.",
        },
        {
          title: "Heresies in History",
          href: "/heresies-history",
          icon: ShieldAlert,
          description: "Overview of major historical heresies.",
        },
        {
          title: "Glossary",
          href: "/glossary",
          icon: BookOpen,
          description: "Definitions of key terms and concepts.",
        }
      ],
    },
    {
      title: "Resources",
      items: [
        {
          title: "Document Library",
          href: "/library",
          icon: Library,
          description: "Manage uploaded reference materials.",
        },
        {
          title: "Learning Tools",
          href: "/learning",
          icon: GraduationCap,
          description: "Interactive quizzes and study aids.",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          href: "/profile",
          icon: UserCircle,
          description: "Manage your user profile.",
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
          description: "Manage application settings.",
        },
      ],
    },
  ],
};
