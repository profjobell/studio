import type { NavItem, SidebarNavItem } from "@/types";
import { Home, FileText, BarChart3, Library, GraduationCap, UserCircle, Settings, Search, ShieldCheck, FileSignature, History, MessageSquareWarning, ScrollText, ClipboardList, BookOpen } from 'lucide-react';

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
    },
    {
      title: "Analyze Content",
      href: "/analyze",
    },
    {
      title: "Content Reports",
      href: "/reports",
    },
    {
      title: "Analyze Teaching",
      href: "/analyze-teaching",
    },
    {
      title: "Teaching Reports",
      href: "/teaching-reports",
    },
    {
      title: "Library",
      href: "/library",
    },
    {
      title: "Learning",
      href: "/learning",
    },
    {
      title: "Glossary",
      href: "/glossary",
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
          icon: Search, // General content analysis
          description: "Submit sermons, articles for theological analysis.",
        },
        {
          title: "Content Reports",
          href: "/reports",
          icon: FileText, // List of reports from general content analysis
          description: "View your content analysis reports.",
        },
        {
          title: "Analyze Teaching",
          href: "/analyze-teaching",
          icon: FileSignature, // Specific teaching/philosophy analysis
          description: "Analyze specific teachings or philosophies.",
        },
        {
          title: "Teaching Reports",
          href: "/teaching-reports",
          icon: History, // List of reports from teaching analysis
          description: "View your teaching analysis reports.",
        },
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
        {
          title: "Glossary",
          href: "/glossary",
          icon: BookOpen,
          description: "Definitions of key terms and concepts.",
        }
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
      ],
    },
  ],
};
