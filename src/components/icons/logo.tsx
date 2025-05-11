import type { SVGProps } from "react";
import { ShieldCheck } from "lucide-react";

export function KJVShieldIcon(props: SVGProps<SVGSVGElement>) {
  return <ShieldCheck {...props} />;
}

export function Logo(props: SVGProps<SVGSVGElement>) {
  // A simple shield or book icon can represent the app's purpose.
  // Using Lucide's ShieldCheck as a placeholder.
  // You can replace this with a custom SVG.
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 12v- духовный-меч-истины-г8v0"/>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="8px" fill="currentColor" fontWeight="bold">KJV</text>
    </svg>
  );
}
