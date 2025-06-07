
"use client"; // Make this a client component

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileUpdateForm } from "./components/profile-update-form";
import { DeleteAccountSection } from "./components/delete-account-section";
import { DashboardPreferenceForm } from "./components/dashboard-preference-form"; // Import new component
import { format } from 'date-fns';
import { fetchConceptuallyAddedUserProfiles, type ConceptuallyAddedUserProfile } from "../settings/actions";
import { ShieldAlert, Loader2 } from "lucide-react"; // Added Loader2

// No longer using static user, will fetch or use localStorage
// const user = {
//   name: "John Doe", 
//   email: "john.doe@example.com",
//   avatarUrl: "https://picsum.photos/seed/userprofile/200/200",
//   joinedDate: new Date("2023-01-15"),
// };

export default function ProfilePage() {
  const [conceptuallyAddedUsers, setConceptuallyAddedUsers] = useState<ConceptuallyAddedUserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentUserDetails, setCurrentUserDetails] = useState<{
    id: string | null;
    name: string;
    email: string;
    avatarUrl: string;
    joinedDate: Date;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingUsers(true);
      try {
        const fetchedDynamicUsers = await fetchConceptuallyAddedUserProfiles();
        setConceptuallyAddedUsers(fetchedDynamicUsers);

        // Determine current user based on localStorage
        const currentUserId = localStorage.getItem('conceptualUserType'); // This acts as ID for base users
        const currentUserEmailFromStorage = localStorage.getItem('conceptualUserEmail');
        
        let name = "KJV User";
        let email = "user@example.com";
        let avatar = "https://placehold.co/100x100/eeeeee/333333?text=U";
        
        if (currentUserId === 'admin' || currentUserId === 'meta') {
            name = currentUserId === 'admin' ? "Admin Sentinel" : "Meta Admin";
            email = `${currentUserId}@kjvsentinel.com`;
            avatar = currentUserId === 'admin' ? "https://placehold.co/100x100/eb2525/ffffff?text=A" : "https://placehold.co/100x100/34d399/000000?text=M";
        } else if (currentUserId === 'richard') {
            name = "Richard Wilkinson";
            email = "rich@home.com";
            avatar = "https://placehold.co/100x100/2563eb/ffffff?text=R";
        } else if (currentUserId && currentUserEmailFromStorage) {
            // Check if it's one of the dynamically added users
            const dynamicUser = fetchedDynamicUsers.find(du => du.id === currentUserId || du.newUserEmail === currentUserEmailFromStorage);
            if (dynamicUser) {
                name = dynamicUser.newDisplayName;
                email = dynamicUser.newUserEmail;
                avatar = `https://placehold.co/100x100/78716c/ffffff?text=${name.charAt(0).toUpperCase()}`;
            } else if (currentUserEmailFromStorage) { // Fallback if ID not found but email exists
                 name = currentUserEmailFromStorage.split('@')[0]; // Simple name from email
                 email = currentUserEmailFromStorage;
            }
        }
        
        setCurrentUserDetails({
          id: currentUserId || 'default', // Use 'default' if no ID found
          name,
          email,
          avatarUrl: avatar,
          joinedDate: new Date("2023-01-15"), // Placeholder join date
        });

      } catch (error) {
        console.error("Error loading user profiles data:", error);
        // Fallback to a default display if error occurs
        setCurrentUserDetails({
            id: 'default',
            name: "KJV User",
            email: "user@example.com",
            avatarUrl: "https://placehold.co/100x100/eeeeee/333333?text=U",
            joinedDate: new Date()
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadData();
  }, []);


  if (isLoadingUsers || !currentUserDetails) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">View and manage your account details.</p>
      </div>

      {/* Main User Profile Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUserDetails.avatarUrl} alt={currentUserDetails.name} data-ai-hint="person avatar"/>
              <AvatarFallback>{currentUserDetails.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{currentUserDetails.name}</CardTitle>
              <CardDescription>Joined on {format(currentUserDetails.joinedDate, 'MM/dd/yyyy')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileUpdateForm initialDisplayName={currentUserDetails.name} initialEmail={currentUserDetails.email} />
        </CardContent>
      </Card>

      <Separator />
      
      {/* Dashboard Preference Form */}
      <DashboardPreferenceForm userId={currentUserDetails.id} />

      <Separator />

      {/* Conceptually Added User Profiles Section */}
      {conceptuallyAddedUsers.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Other Conceptually Added User Profiles (from Admin Settings)</CardTitle>
            <CardDescription>
              These profiles were added during this session via the Admin Settings panel. They are not real Firebase users. Your current active profile is highlighted above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conceptuallyAddedUsers.filter(u => u.id !== currentUserDetails.id && u.newUserEmail !== currentUserDetails.email).map((addedUser) => (
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

      {/* Danger Zone Card */}
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
