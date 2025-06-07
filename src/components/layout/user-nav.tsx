
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
import { LogOut, User, Settings, LifeBuoy, Repeat, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { fetchConceptuallyAddedUserProfiles, type ConceptuallyAddedUserProfile } from "@/app/(app)/settings/actions";

interface CombinedUserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isBaseUser: boolean; 
  isAdmin?: boolean; 
  type: string; 
}

const baseConceptualUsers: Record<string, Omit<CombinedUserProfile, 'id' | 'isBaseUser' | 'type'>> = {
  default: {
    name: "KJV User",
    email: "user@example.com",
    avatar: "https://placehold.co/100x100/eeeeee/333333?text=U",
    isAdmin: false,
  },
  admin: {
    name: "Admin Sentinel",
    email: "admin@kjvsentinel.com",
    avatar: "https://placehold.co/100x100/eb2525/ffffff?text=A",
    isAdmin: true,
  },
  richard: {
    name: "Richard Wilkinson",
    email: "rich@home.com",
    avatar: "https://placehold.co/100x100/2563eb/ffffff?text=R",
    isAdmin: false,
  },
  meta: { 
    name: "Meta Admin",
    email: "meta@kjvsentinel.com",
    avatar: "https://placehold.co/100x100/34d399/000000?text=M",
    isAdmin: true,
  }
};

export function UserNav() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<CombinedUserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<CombinedUserProfile | null>(null);
  const [isLoadingUsers, startLoadingUsersTransition] = useTransition();

  useEffect(() => {
    setIsClient(true);

    const loadUsers = async () => {
      startLoadingUsersTransition(async () => {
        const baseUsersArray: CombinedUserProfile[] = Object.entries(baseConceptualUsers).map(([key, val]) => ({
          id: key,
          type: key,
          ...val,
          isBaseUser: true,
        }));

        let dynamicUsersArray: CombinedUserProfile[] = [];
        try {
          const fetchedDynamicUsers = await fetchConceptuallyAddedUserProfiles();
          dynamicUsersArray = fetchedDynamicUsers.map(du => ({
            id: du.id,
            name: du.newDisplayName,
            email: du.newUserEmail,
            avatar: `https://placehold.co/100x100/78716c/ffffff?text=${du.newDisplayName.charAt(0).toUpperCase()}`,
            isBaseUser: false,
            isAdmin: du.isAdmin,
            type: du.id, 
          }));
        } catch (e) {
          console.error("Failed to fetch dynamic conceptual users:", e);
        }
        
        const combinedUsers = [...baseUsersArray, ...dynamicUsersArray];
        setAllUsers(combinedUsers);

        // Determine current user from localStorage
        const storedUserType = localStorage.getItem('conceptualUserType');
        const adminBypassActive = localStorage.getItem('adminBypassActive') === 'true';
        let activeUser: CombinedUserProfile | undefined;

        if (adminBypassActive) {
          activeUser = combinedUsers.find(u => u.type === 'admin' && u.isBaseUser);
        } else if (storedUserType) {
          activeUser = combinedUsers.find(u => u.type === storedUserType);
        }
        
        setCurrentUser(activeUser || combinedUsers.find(u => u.type === 'default' && u.isBaseUser) || baseUsersArray[0]);
      });
    };
    
    loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSwitchUser = (userTypeOrId: string) => {
    const selectedUser = allUsers.find(u => u.type === userTypeOrId);
    if (selectedUser) {
      setCurrentUser(selectedUser);
      localStorage.setItem('conceptualUserType', selectedUser.type);
      localStorage.setItem('conceptualUserEmail', selectedUser.email);
      if (selectedUser.isAdmin) {
        localStorage.setItem('adminBypassActive', 'true');
      } else {
        localStorage.removeItem('adminBypassActive');
      }
      
      // Refresh the page to ensure all components re-evaluate access based on new conceptual user
      // This is important for things like the Settings page access.
      router.refresh();
      // Consider a less disruptive update if possible, e.g. via global state/context if implemented
    }
  };

  const handleLogout = async () => {
    console.log("Logout action initiated");
    localStorage.removeItem('conceptualUserType'); 
    localStorage.removeItem('adminBypassActive');
    localStorage.removeItem('conceptualUserEmail');
    setCurrentUser(allUsers.find(u => u.type === 'default' && u.isBaseUser) || null); // Reset to default conceptually
    router.push('/signin');
  };

  if (!isClient || !currentUser) {
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
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="profile person placeholder" />
            <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount> 
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
            {currentUser.isAdmin && (
              <span className="text-xs text-primary flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Admin Privileges
              </span>
            )}
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
           {currentUser.isAdmin && (
            <Link href="/settings" passHref>
                <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin Settings</span>
                </DropdownMenuItem>
            </Link>
           )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Switch Conceptual User</DropdownMenuLabel>
        {isLoadingUsers && <DropdownMenuItem disabled>Loading users...</DropdownMenuItem>}
        {!isLoadingUsers && allUsers.map((profile) => (
          currentUser.type !== profile.type && (
            <DropdownMenuItem key={profile.type} onClick={() => handleSwitchUser(profile.type)}>
              <Repeat className="mr-2 h-4 w-4" />
              <span>View as {profile.name}</span>
              {profile.isAdmin && <ShieldCheck className="ml-auto h-3 w-3 text-primary" />}
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
