
"use server";

import { redirect } from 'next/navigation';

export async function handleSignIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Make email check case-insensitive for robustness
  if (email && email.toLowerCase() === "admin@kjvsentinel.com" && password === "N0tjuni0r") {
    console.log("Default admin login successful");
    redirect("/dashboard");
  } else if (email && email.toLowerCase() === "rich@home.com" && password === "John3:16") {
    console.log("Richard Wilkinson login successful");
    redirect("/dashboard");
  }
   else {
    console.log("Invalid credentials or not a recognized account.");
    redirect("/signin?error=invalid_credentials");
  }
}

export async function handleGoogleSignIn() {
  "use server";
  console.log("Google Sign In attempt");
  // Firebase Google Sign-In logic would go here.
  // For this demo, we'll indicate it's not fully implemented.
  redirect("/signin?error=google_not_implemented");
}

