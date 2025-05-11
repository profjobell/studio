import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { siteConfig } from "@/config/site";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-semibold">
            <Logo className="h-8 w-8 text-primary" />
            <span>{siteConfig.name}</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
