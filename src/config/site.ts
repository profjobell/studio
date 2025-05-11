import type { NavItem, SidebarNavItem } from "@/types";
import { Home, FileText, BarChart3, Library, GraduationCap, UserCircle, Settings, Search, ShieldCheck } from 'lucide-react';

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
      title: "Analyze",
      href: "/analyze",
    },
    {
      title: "Reports",
      href: "/reports",
    },
    {
      title: "Library",
      href: "/library",
    },
    {
      title: "Learning",
      href: "/learning",
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
      title: "Analysis",
      items: [
        {
          title: "Analyze Content",
          href: "/analyze",
          icon: Search,
          description: "Submit content for theological analysis.",
        },
        {
          title: "My Reports",
          href: "/reports",
          icon: FileText,
          description: "View and manage your analysis reports.",
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
        // Settings might be part of profile or its own page
        // {
        //   title: "Settings",
        //   href: "/settings",
        //   icon: Settings,
        //   description: "Adjust application settings.",
        // },
      ],
    },
  ],
};
