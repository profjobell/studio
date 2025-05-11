import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileUpdateForm } from "./components/profile-update-form";
import { DeleteAccountSection } from "./components/delete-account-section";

export const metadata = {
  title: "User Profile - KJV Sentinel",
  description: "Manage your KJV Sentinel user profile.",
};

// Placeholder user data - in a real app, this would be fetched based on the authenticated user
const user = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatarUrl: "https://picsum.photos/seed/userprofile/200/200",
  joinedDate: new Date("2023-01-15"),
};

// Server actions are now in src/app/(app)/profile/actions.ts

export default async function ProfilePage() {
  // In a real app, fetch user data here if needed for the server part of the page
  // const userData = await getCurrentUser(); // Example

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">View and manage your account details.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar"/>
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>Joined on {user.joinedDate.toLocaleDateString()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileUpdateForm initialDisplayName={user.name} initialEmail={user.email} />
        </CardContent>
      </Card>

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
