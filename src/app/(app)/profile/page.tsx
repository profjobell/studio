
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileUpdateForm } from "./components/profile-update-form";
import { DeleteAccountSection } from "./components/delete-account-section";
import { format } from 'date-fns';
import { fetchConceptuallyAddedUserProfiles, type ConceptuallyAddedUserProfile } from "../settings/actions";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "User Profile - KJV Sentinel",
  description: "Manage your KJV Sentinel user profile.",
};

// Placeholder user data - in a real app, this would be fetched based on the authenticated user
const user = {
  name: "John Doe", // This will be the main profile displayed
  email: "john.doe@example.com",
  avatarUrl: "https://picsum.photos/seed/userprofile/200/200",
  joinedDate: new Date("2023-01-15"),
};

export default async function ProfilePage() {
  const conceptuallyAddedUsers: ConceptuallyAddedUserProfile[] = await fetchConceptuallyAddedUserProfiles();

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
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar"/>
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>Joined on {format(user.joinedDate, 'MM/dd/yyyy')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileUpdateForm initialDisplayName={user.name} initialEmail={user.email} />
        </CardContent>
      </Card>

      <Separator />

      {/* Conceptually Added User Profiles Section */}
      {conceptuallyAddedUsers.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Conceptually Added User Profiles (via Admin Settings)</CardTitle>
            <CardDescription>
              These profiles were added during this session via the Admin Settings panel. They are not real Firebase users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conceptuallyAddedUsers.map((addedUser) => (
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
