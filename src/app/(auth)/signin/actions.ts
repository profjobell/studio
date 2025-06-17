
"use server";

import { redirect } from 'next/navigation';

export async function handleSignIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Make email check case-insensitive for robustness
  if (email && email.toLowerCase() === "admin@kjvsentinel.com" && password === "N0tjuni0r") {
    // conceptualUserType, conceptualUserEmail, adminBypassActive are set client-side on redirect for this demo
    redirect("/dashboard?user=admin"); // Pass conceptual user type
  } else if (email && email.toLowerCase() === "rich@home.com" && password === "John3:16") {
    redirect("/dashboard?user=richard"); // Pass conceptual user type
  } else if (email && email.toLowerCase() === "meta@kjvsentinel.com" && password === "N0tjuni0r") {
    redirect("/dashboard?user=meta"); // Pass conceptual user type (new admin)
  }
   else {
    redirect("/signin?error=invalid_credentials");
  }
}

export async function handleGoogleSignIn() {
  "use server";
  // Firebase Google Sign-In logic would go here.
  // For this demo, we'll indicate it's not fully implemented.
  redirect("/signin?error=google_not_implemented");
}


