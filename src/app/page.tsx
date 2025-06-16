
"use client"; // This page needs to be a client component for localStorage and router

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { siteConfig } from '@/config/site';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { FeaturesGuideModal } from '@/components/features-guide';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function LandingPage() {
  const router = useRouter();

  const handleBtfKvnGuestLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('conceptualUserType', 'btf-kvn-guest');
      localStorage.setItem('conceptualUserEmail', 'btf-kvn@guest.com');
      localStorage.removeItem('adminBypassActive'); // Ensure no admin bypass
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">
              {siteConfig.name}
            </span>
          </Link>
          <nav className="flex flex-1 items-center space-x-2 sm:space-x-4 sm:justify-end"> {/* Adjusted spacing for new button */}
            {/* Future public nav items can go here */}
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="sm" // Adjusted size slightly for text
              className="rounded-full h-9 w-auto px-3" // Auto width, maintain height, add padding
              onClick={handleBtfKvnGuestLogin}
              title="BTF-KVN Guest Access"
              aria-label="BTF-KVN Guest Access"
            >
              <span className="font-semibold text-xs">BTF</span> {/* Using text instead of image */}
            </Button>

            <Button asChild variant="ghost">
              <Link href="/signin">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Analyze Religious Content with{' '}
                    <span className="text-primary">{siteConfig.name}</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Leverage the power of AI to analyze theological content against the King James Version (KJV) 1611 Bible. Uncover insights on accuracy, historical context, manipulative tactics, and doctrinal influences.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                  <FeaturesGuideModal>
                    <Button variant="outline" size="lg">Learn More</Button>
                  </FeaturesGuideModal>
                </div>
              </div>
              <div className="mx-auto flex flex-col items-center justify-center rounded-xl bg-muted p-6 shadow-md sm:w-full lg:order-last lg:aspect-square">
                 <h2 className="text-xl font-semibold text-primary mb-4 text-center">
                  Illuminating Truth Through Scriptural Analysis
                </h2>
                <p className="text-center text-foreground/80 text-sm md:text-base leading-relaxed">
                  KJV Sentinel offers robust tools for in-depth theological examination. We meticulously compare submitted content against the authoritative King James Version (1611) Bible.
                </p>
                <p className="text-center text-foreground/80 text-sm md:text-base leading-relaxed mt-3">
                  Our platform empowers you to discern doctrinal nuances, understand historical contexts, identify manipulative tactics, and recognize various influences within religious discourse, all grounded in the KJV.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Comprehensive Theological Analysis
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We understand that it can feel daunting to ask questions about sermons or religious teachings, especially if you worry about seeming out of place. Our platform provides a warm, welcoming space with easy-to-use tools designed to gently guide you toward a clearer understanding of what’s shared from the pulpit. Here, you can explore with confidence, free from judgment, and deepen your connection to the message at your own pace.
                  <span className="block mt-2 text-sm font-bold italic"> - Brother Joseph Bell</span>
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 pt-12">
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Content Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Submit text, audio, video, or documents for in-depth analysis.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">KJV 1611 Reference</h3>
                <p className="text-sm text-muted-foreground">
                  All analyses are cross-referenced with the King James Version 1611.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">"Ism" Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Identify theological and philosophical "isms" present in the content.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Calvinism Analyzer</h3>
                <p className="text-sm text-muted-foreground">
                  Specialized tools to detect and analyze Calvinistic influences.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Detailed Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Receive comprehensive, formatted reports that are easy to read, save, and share.
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Learning Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Interactive quizzes and scripture memory aids to enhance your understanding.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4 text-muted-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4 text-muted-foreground"
          >
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
