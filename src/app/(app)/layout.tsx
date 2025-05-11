import Link from "next/link";
// Removed imports from "@/components/ui/sidebar" as SidebarProvider is no longer used
// and other specific sidebar components were not used in this file directly.
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react"; 
import { Logo } from "@/components/icons/logo";
import { siteConfig } from "@/config/site";
import { UserNav } from "@/components/layout/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
// Input and ScrollArea were not used directly in this file's components.
// If they are needed by child pages, they should be imported there or remain if AppHeader/AppSidebar used them implicitly via other components.
// For now, assuming they are not directly needed by this layout file after removing SidebarProvider.

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    // <SidebarProvider defaultOpen> Removed SidebarProvider
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 print:pl-0">
          <AppHeader />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:p-0">
            {children}
          </main>
        </div>
      </div>
    // </SidebarProvider> Removed SidebarProvider
  );
}

function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex print:hidden">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="sr-only">{siteConfig.name}</span>
        </Link>
        {siteConfig.sidebarNav.map((group, groupIndex) =>
          group.items.map((item, itemIndex) => (
            item.icon && item.href && ( // Ensure href exists before rendering Link
              <Link
                key={`${groupIndex}-${itemIndex}`}
                href={item.href}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                title={item.title}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.title}</span>
              </Link>
            )
          ))
        )}
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <ThemeToggle />
        <UserNav />
      </nav>
    </aside>
  );
}


function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">{siteConfig.name}</span>
            </Link>
            {siteConfig.mainNav.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
       <div className="relative ml-auto flex-1 md:grow-0">
        {/* Placeholder for global search if needed */}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {/* Placeholder for notifications if needed */}
        {/* <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button> */}
      </div>
    </header>
  );
}