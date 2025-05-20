
"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, LifeBuoy, Repeat } from "lucide-react" // Added Repeat for Switch
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ConceptualUserType = 'default' | 'admin' | 'richard';

interface ConceptualUserProfile {
  name: string;
  email: string;
  avatar: string;
  type: ConceptualUserType;
}

const conceptualUsers: Record<ConceptualUserType, ConceptualUserProfile> = {
  default: {
    name: "KJV User",
    email: "user@example.com",
    avatar: "https://placehold.co/100x100/eeeeee/333333?text=U",
    type: 'default',
  },
  admin: {
    name: "Admin Sentinel",
    email: "admin@kjvsentinel.com",
    avatar: "https://placehold.co/100x100/eb2525/ffffff?text=A",
    type: 'admin',
  },
  richard: {
    name: "Richard Wilkinson",
    email: "rich@home.com",
    avatar: "https://placehold.co/100x100/2563eb/ffffff?text=R",
    type: 'richard',
  },
};

export function UserNav() {
  const router = useRouter();
  const [currentUserType, setCurrentUserType] = useState<ConceptualUserType>('default');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedUserType = localStorage.getItem('conceptualUserType') as ConceptualUserType | null;
    if (storedUserType && conceptualUsers[storedUserType]) {
      setCurrentUserType(storedUserType);
    }
  }, []);

  const handleSwitchUser = (userType: ConceptualUserType) => {
    setCurrentUserType(userType);
    if (typeof window !== 'undefined') {
      localStorage.setItem('conceptualUserType', userType);
    }
    // Optionally, refresh or navigate to dashboard to reflect changes broadly
    // router.refresh(); 
    // router.push('/dashboard'); // Could be too disruptive
  };

  const handleLogout = async () => {
    console.log("Logout action initiated");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('conceptualUserType'); // Clear conceptual user on logout
    }
    router.push('/signin');
  };

  const user = isClient ? conceptualUsers[currentUserType] : conceptualUsers.default;

  if (!isClient) {
    // Render a placeholder or null during SSR to avoid hydration mismatch
    // Or use a skeleton loader
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name || "User"} data-ai-hint="profile person placeholder" />
            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile" passHref>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          {/* Settings link is globally controlled by siteConfig now */}
          {/* conceptualUsers.admin.email === user.email && (
             <Link href="/settings" passHref>
                <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin Settings</span>
                </DropdownMenuItem>
            </Link>
          )*/}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Switch Conceptual User</DropdownMenuLabel>
        {Object.values(conceptualUsers).map((profile) => (
          currentUserType !== profile.type && (
            <DropdownMenuItem key={profile.type} onClick={() => handleSwitchUser(profile.type)}>
              <Repeat className="mr-2 h-4 w-4" />
              <span>View as {profile.name}</span>
            </DropdownMenuItem>
          )
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => alert("Support clicked (placeholder)")}>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
