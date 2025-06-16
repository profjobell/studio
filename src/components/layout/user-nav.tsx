
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
  avatar: string; // Base generated avatar URL
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
  },
  'btf-kvn-guest': { 
    name: "BTF-KVN Guest",
    email: "btf-kvn@guest.com",
    avatar: "https://placehold.co/100x100/64748b/ffffff?text=BG", // Placeholder avatar for BTF-KVN Guest
    isAdmin: false,
  },
};

const getGeneratedAvatarUrlForUser = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  return `https://placehold.co/100x100/78716c/ffffff?text=${initials}`;
};

export function UserNav() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<CombinedUserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<CombinedUserProfile | null>(null);
  const [isLoadingUsers, startLoadingUsersTransition] = useTransition();
  const [displayAvatarSrc, setDisplayAvatarSrc] = useState<string | undefined>(undefined);


  useEffect(() => {
    setIsClient(true);

    const loadUsersAndAvatar = async () => {
      startLoadingUsersTransition(async () => {
        const baseUsersArray: CombinedUserProfile[] = Object.entries(baseConceptualUsers).map(([key, val]) => ({
          id: key, // Use key as ID for base users
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
            avatar: getGeneratedAvatarUrlForUser(du.newDisplayName), 
            isBaseUser: false,
            isAdmin: du.isAdmin,
            type: du.id, 
          }));
        } catch (e) {
          console.error("Failed to fetch dynamic conceptual users:", e);
        }
        
        const combinedUsers = [...baseUsersArray, ...dynamicUsersArray];
        setAllUsers(combinedUsers);

        const storedUserType = localStorage.getItem('conceptualUserType');
        const adminBypassActive = localStorage.getItem('adminBypassActive') === 'true';
        let activeUser: CombinedUserProfile | undefined;

        if (adminBypassActive) {
          activeUser = combinedUsers.find(u => u.type === 'admin' && u.isBaseUser);
        } else if (storedUserType) {
          // Prioritize matching by 'type' (which is 'id' for dynamic users)
          activeUser = combinedUsers.find(u => u.type === storedUserType);
        }
        
        const resolvedCurrentUser = activeUser || combinedUsers.find(u => u.type === 'default' && u.isBaseUser) || baseUsersArray[0];
        setCurrentUser(resolvedCurrentUser);

        if (resolvedCurrentUser && resolvedCurrentUser.id) {
          const storedAvatarSrc = localStorage.getItem(`avatarSrc_${resolvedCurrentUser.id}`);
          const storedAvatarType = localStorage.getItem(`avatarType_${resolvedCurrentUser.id}`);
          if (storedAvatarSrc && storedAvatarType === 'uploaded') {
            setDisplayAvatarSrc(storedAvatarSrc);
          } else if (storedAvatarType === 'generated' && storedAvatarSrc) {
            setDisplayAvatarSrc(storedAvatarSrc);
          }
          else {
            setDisplayAvatarSrc(resolvedCurrentUser.avatar); 
          }
        } else if (resolvedCurrentUser) {
           setDisplayAvatarSrc(resolvedCurrentUser.avatar);
        }
      });
    };
    
    loadUsersAndAvatar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  useEffect(() => {
    if (currentUser && currentUser.id) {
      const storedAvatarSrc = localStorage.getItem(`avatarSrc_${currentUser.id}`);
      const storedAvatarType = localStorage.getItem(`avatarType_${currentUser.id}`);
      
      if (storedAvatarSrc && storedAvatarType === 'uploaded') {
        setDisplayAvatarSrc(storedAvatarSrc);
      } else if (storedAvatarType === 'generated' && storedAvatarSrc) {
        setDisplayAvatarSrc(storedAvatarSrc);
      }
      else {
        setDisplayAvatarSrc(currentUser.avatar); 
      }
    } else if (currentUser) {
      setDisplayAvatarSrc(currentUser.avatar);
    }
  }, [currentUser]);


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
      
      const storedAvatarSrc = localStorage.getItem(`avatarSrc_${selectedUser.id}`);
      const storedAvatarType = localStorage.getItem(`avatarType_${selectedUser.id}`);
      if (storedAvatarSrc && storedAvatarType === 'uploaded') {
        setDisplayAvatarSrc(storedAvatarSrc);
      } else if (storedAvatarType === 'generated' && storedAvatarSrc) {
         setDisplayAvatarSrc(storedAvatarSrc);
      }
      else {
        setDisplayAvatarSrc(selectedUser.avatar);
      }
      
      router.refresh();
    }
  };

  const handleLogout = async () => {
    console.log("Logout action initiated");
    const defaultUser = allUsers.find(u => u.type === 'default' && u.isBaseUser) || null;
    
    localStorage.removeItem('conceptualUserType'); 
    localStorage.removeItem('adminBypassActive');
    localStorage.removeItem('conceptualUserEmail');
    
    setCurrentUser(defaultUser); 
    if (defaultUser) {
        const defaultAvatarSrc = localStorage.getItem(`avatarSrc_${defaultUser.id}`);
        const defaultAvatarType = localStorage.getItem(`avatarType_${defaultUser.id}`);
        if(defaultAvatarSrc && defaultAvatarType === 'uploaded') {
            setDisplayAvatarSrc(defaultAvatarSrc);
        } else {
            setDisplayAvatarSrc(defaultUser.avatar);
        }
    } else {
        setDisplayAvatarSrc(undefined); 
    }
    
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
  
  const avatarInitials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayAvatarSrc || undefined} alt={currentUser.name} data-ai-hint="profile person custom" />
            <AvatarFallback>{avatarInitials}</AvatarFallback>
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
