import type { Metadata } from "next";
import { LibraryManagement } from "./components/library-management";
import { fetchLibraryDocuments } from "./actions"; // Server Action
import type { DocumentReference } from "@/types";

export const metadata: Metadata = {
  title: "Document Library - KJV Sentinel",
  description: "Manage your uploaded reference materials for theological analysis.",
};

// Server actions (uploadDocumentAction, deleteDocumentAction) are now in ./actions.ts

export default async function LibraryPage() {
  // Fetch documents server-side
  const documents: DocumentReference[] = await fetchLibraryDocuments();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Library</h1>
        <p className="text-muted-foreground">
          Upload, manage, and search your personal reference materials.
        </p>
      </div>
      <LibraryManagement initialDocuments={documents} />
    </div>
  );
}

// Remove the old placeholder Label component from here if it was defined locally
// import { Label } from "@/components/ui/label"; // Ensure Label is imported if used in LibraryManagement or here
