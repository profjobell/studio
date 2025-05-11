import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "User Profile - KJV Sentinel",
  description: "Manage your KJV Sentinel user profile.",
};

// Placeholder user data
const user = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatarUrl: "https://picsum.photos/seed/userprofile/200/200",
  joinedDate: new Date("2023-01-15"),
};

// Placeholder server action for updating profile
async function updateProfile(formData: FormData) {
  "use server";
  const displayName = formData.get("displayName") as string;
  const email = formData.get("email") as string; // Email change might need verification
  console.log("Updating profile:", { displayName, email });
  // Actual Firebase update logic here
}

// Placeholder server action for deleting account
async function deleteAccount() {
  "use server";
  if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    console.log("Deleting account...");
    // Actual Firebase account deletion logic here
  }
}


export default function ProfilePage() {
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
          <form action={updateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} />
              </div>
            </div>
            
            {/* Placeholder for password change */}
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password (Optional)</Label>
                <Input id="newPassword" name="newPassword" type="password" placeholder="Leave blank to keep current password" />
            </div>

            <Button type="submit">Update Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Manage sensitive account actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteAccount}>
            <div className="space-y-2">
              <p className="text-sm">
                Deleting your account is permanent and cannot be undone. All your data, including analysis reports and uploaded documents, will be removed.
              </p>
              <Button variant="destructive" type="submit">
                Delete My Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
