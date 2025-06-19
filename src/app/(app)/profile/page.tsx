
"use client"; // Make this a client component

import { useEffect, useState, ChangeEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button"; // Imported buttonVariants
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileUpdateForm } from "./components/profile-update-form";
import { DeleteAccountSection } from "./components/delete-account-section";
import { DashboardPreferenceForm } from "./components/dashboard-preference-form";
import { format } from 'date-fns';
import { fetchConceptuallyAddedUserProfiles, type ConceptuallyAddedUserProfile } from "../settings/actions";
import { ShieldAlert, Loader2, ArrowLeft, Upload, Trash2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Imported cn

export default function ProfilePage() {
  const [conceptuallyAddedUsers, setConceptuallyAddedUsers] = useState<ConceptuallyAddedUserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentUserDetails, setCurrentUserDetails] = useState<{
    id: string | null;
    name: string;
    email: string;
    avatarUrl: string; // This will be the fallback/initial generated URL
    joinedDate: Date;
  } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // State for avatar management
  const [currentAvatarSrc, setCurrentAvatarSrc] = useState<string | null>(null);
  const [avatarFileType, setAvatarFileType] = useState<'generated' | 'uploaded'>('generated');


  const getGeneratedAvatarUrl = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    return `https://placehold.co/100x100/78716c/ffffff?text=${initials}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingUsers(true);
      try {
        const fetchedDynamicUsers = await fetchConceptuallyAddedUserProfiles();
        setConceptuallyAddedUsers(fetchedDynamicUsers);

        const currentUserId = localStorage.getItem('conceptualUserType');
        const currentUserEmailFromStorage = localStorage.getItem('conceptualUserEmail');

        let name = "KJV User";
        let email = "user@example.com";
        let baseAvatar = "https://placehold.co/100x100/eeeeee/333333?text=U";
        let userIdToSet = 'default';

        if (currentUserId === 'admin' || currentUserId === 'meta') {
            name = currentUserId === 'admin' ? "Admin Sentinel" : "Meta Admin";
            email = `${currentUserId}@kjvsentinel.com`;
            baseAvatar = currentUserId === 'admin' ? "https://placehold.co/100x100/eb2525/ffffff?text=A" : "https://placehold.co/100x100/34d399/000000?text=M";
            userIdToSet = currentUserId;
        } else if (currentUserId === 'richard') {
            name = "Richard Wilkinson";
            email = "rich@home.com";
            baseAvatar = "https://placehold.co/100x100/2563eb/ffffff?text=R";
            userIdToSet = currentUserId;
        } else if (currentUserId === 'btf-kvn-guest') {
            name = "BTF-KVN Guest";
            email = "btf-kvn@guest.com";
            baseAvatar = "https://placehold.co/100x100/64748b/ffffff?text=BG";
            userIdToSet = currentUserId;
        }
         else if (currentUserId && currentUserEmailFromStorage) {
            const dynamicUser = fetchedDynamicUsers.find(du => du.id === currentUserId || du.newUserEmail === currentUserEmailFromStorage);
            if (dynamicUser) {
                name = dynamicUser.newDisplayName;
                email = dynamicUser.newUserEmail;
                baseAvatar = getGeneratedAvatarUrl(name);
                userIdToSet = dynamicUser.id;
            } else if (currentUserEmailFromStorage) {
                 name = currentUserEmailFromStorage.split('@')[0];
                 email = currentUserEmailFromStorage;
                 baseAvatar = getGeneratedAvatarUrl(name);
                 userIdToSet = currentUserId || `guest-${Date.now()}`;
            }
        }

        const userDetails = {
          id: userIdToSet,
          name,
          email,
          avatarUrl: baseAvatar,
          joinedDate: new Date("2023-01-15"),
        };
        setCurrentUserDetails(userDetails);

        // Load avatar preference from localStorage
        if (userIdToSet) {
          const storedAvatarSrc = localStorage.getItem(`avatarSrc_${userIdToSet}`);
          const storedAvatarType = localStorage.getItem(`avatarType_${userIdToSet}`) as ('uploaded' | 'generated' | null);
          if (storedAvatarSrc && storedAvatarType === 'uploaded') {
            setCurrentAvatarSrc(storedAvatarSrc);
            setAvatarFileType('uploaded');
          } else {
            setCurrentAvatarSrc(userDetails.avatarUrl); // Use the generated one
            setAvatarFileType('generated');
          }
        }


      } catch (error) {
        console.error("Error loading user profiles data:", error);
        const fallbackDetails = {
            id: 'default',
            name: "KJV User",
            email: "user@example.com",
            avatarUrl: "https://placehold.co/100x100/eeeeee/333333?text=U",
            joinedDate: new Date()
        };
        setCurrentUserDetails(fallbackDetails);
        setCurrentAvatarSrc(fallbackDetails.avatarUrl);
        setAvatarFileType('generated');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadData();
  }, []);

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUserDetails?.id) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setCurrentAvatarSrc(dataUri);
        setAvatarFileType('uploaded');
        localStorage.setItem(`avatarSrc_${currentUserDetails.id}`, dataUri);
        localStorage.setItem(`avatarType_${currentUserDetails.id}`, 'uploaded');
        toast({ title: "Avatar Updated", description: "Your new avatar has been set." });
        router.refresh();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCustomAvatar = () => {
    if (currentUserDetails?.id) {
      const generatedUrl = getGeneratedAvatarUrl(currentUserDetails.name);
      setCurrentAvatarSrc(generatedUrl);
      setAvatarFileType('generated');
      localStorage.removeItem(`avatarSrc_${currentUserDetails.id}`);
      localStorage.setItem(`avatarType_${currentUserDetails.id}`, 'generated');
      toast({ title: "Custom Avatar Removed", description: "Reverted to generated avatar." });
      router.refresh();
    }
  };

  const handleUseGeneratedAvatar = () => {
    if (currentUserDetails?.id) {
      const generatedUrl = getGeneratedAvatarUrl(currentUserDetails.name);
      setCurrentAvatarSrc(generatedUrl);
      setAvatarFileType('generated');
      localStorage.setItem(`avatarSrc_${currentUserDetails.id}`, generatedUrl); // Store generated as well
      localStorage.setItem(`avatarType_${currentUserDetails.id}`, 'generated');
      toast({ title: "Avatar Changed", description: "Switched to generated avatar." });
      router.refresh();
    }
  };


  if (isLoadingUsers || !currentUserDetails) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const avatarInitials = currentUserDetails.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || 'U';

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">View and manage your account details.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Previous Screen
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentAvatarSrc || undefined} alt={currentUserDetails.name} data-ai-hint="profile person custom" />
              <AvatarFallback>{avatarInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center sm:text-left">
              <CardTitle className="text-2xl">{currentUserDetails.name}</CardTitle>
              <CardDescription>Joined on {format(currentUserDetails.joinedDate, 'MM/dd/yyyy')}</CardDescription>
               <div className="mt-3 flex flex-col sm:flex-row gap-2 items-center sm:items-start justify-center sm:justify-start">
                <Label htmlFor="avatarUpload" className={cn(buttonVariants({variant: "outline", size:"sm"}), "cursor-pointer")}>
                  <Upload className="mr-2 h-4 w-4" /> Upload New
                </Label>
                <Input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

                <Button variant="outline" size="sm" onClick={handleUseGeneratedAvatar}>
                  <UserIcon className="mr-2 h-4 w-4" /> Use Generated
                </Button>

                {avatarFileType === 'uploaded' && (
                  <Button variant="destructive" size="sm" onClick={handleDeleteCustomAvatar}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Custom
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileUpdateForm
            userId={currentUserDetails.id!}
            initialDisplayName={currentUserDetails.name}
            initialEmail={currentUserDetails.email}
          />
        </CardContent>
      </Card>

      <Separator />

      <DashboardPreferenceForm userId={currentUserDetails.id} />

      <Separator />

      {conceptuallyAddedUsers.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Other Conceptually Added User Profiles (from Admin Settings)</CardTitle>
            <CardDescription>
              These profiles were added during this session via the Admin Settings panel. They are not real Firebase users. Your current active profile is highlighted above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conceptuallyAddedUsers.filter(u => u.id !== currentUserDetails?.id && u.newUserEmail !== currentUserDetails?.email).map((addedUser) => (
              <div key={addedUser.id} className="p-3 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{addedUser.newDisplayName}</p>
                    <p className="text-sm text-muted-foreground">{addedUser.newUserEmail}</p>
                  </div>
                  {addedUser.isAdmin && (
                    <span className="text-xs font-medium text-primary flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4" /> Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      <Card className="border-destructive shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Manage sensitive account actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountSection />
        </CardContent>
      </Card>
    </div>
  );
}
