import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "./components/signin-form";

export default function SignInPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your email below to login to your account or use the default admin credentials.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <SignInForm />
      </CardContent>
    </Card>
  );
}
