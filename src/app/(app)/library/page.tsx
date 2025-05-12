
import type { Metadata } from "next";
import { LibraryManagement } from "./components/library-management";
import { fetchLibraryDocuments } from "./actions"; // Server Action
import type { DocumentReference } from "@/types";

export const metadata: Metadata = {
  title: "Document Library - KJV Sentinel",
  description: "Manage your uploaded reference materials for theological analysis.",
};

export default async function LibraryPage() {
  const documents: DocumentReference[] = await fetchLibraryDocuments();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Document Library</h1>
        <p className="text-muted-foreground">
          Upload, manage, and search your personal reference materials. Acceptable formats: PDF, TXT, DOCX.
        </p>
      </div>
      <LibraryManagement initialDocuments={documents} />
    </div>
  );
}
