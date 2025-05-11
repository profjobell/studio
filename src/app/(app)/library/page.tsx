import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Trash2, Download, UploadCloud, FileText, Search as SearchIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentReference } from "@/types";

export const metadata = {
  title: "Document Library - KJV Sentinel",
  description: "Manage your uploaded reference materials for theological analysis.",
};

// Placeholder data - replace with actual data fetching from Firestore
const sampleDocuments: DocumentReference[] = [
  {
    id: "doc-001",
    userId: "user-123",
    fileName: "Systematic_Theology_Grudem.pdf",
    fileType: "application/pdf",
    fileSize: 5242880, // 5MB
    storagePath: "/documents/user-123/Systematic_Theology_Grudem.pdf",
    uploadDate: new Date("2025-05-10T10:00:00Z"),
  },
  {
    id: "doc-002",
    userId: "user-123",
    fileName: "Early_Church_Fathers_Quotes.txt",
    fileType: "text/plain",
    fileSize: 102400, // 100KB
    storagePath: "/documents/user-123/Early_Church_Fathers_Quotes.txt",
    uploadDate: new Date("2025-04-20T15:30:00Z"),
  },
  {
    id: "doc-003",
    userId: "user-123",
    fileName: "Reformed_Confessions.docx",
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 2097152, // 2MB
    storagePath: "/documents/user-123/Reformed_Confessions.docx",
    uploadDate: new Date("2025-03-15T09:00:00Z"),
  },
];

// Placeholder server actions
async function deleteDocumentAction(docId: string) {
  "use server";
  console.log(`Attempting to delete document: ${docId}`);
  // Actual deletion logic here (Firestore record and Cloud Storage file)
}

async function uploadDocumentAction(formData: FormData) {
  "use server";
  const file = formData.get("documentFile") as File;
  if (file) {
    console.log(`Uploading document: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    // Actual upload logic to Firebase Cloud Storage
    // Then create Firestore record for the document
    // For demo: check file type and size here
    if (file.size > 100 * 1024 * 1024) { // 100MB
      // return error
      console.error("File too large");
      return;
    }
    const allowedTypes = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid file type");
      return;
    }
  } else {
    console.error("No file provided");
  }
}


export default async function LibraryPage() {
  // In a real app, fetch documents for the current user
  const documents = sampleDocuments;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Library</h1>
        <p className="text-muted-foreground">
          Upload, manage, and search your personal reference materials.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
          <CardDescription>
            Add PDF, TXT, or DOCX files to your library. Max 100MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={uploadDocumentAction} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="documentFile">Select Document</Label>
              <Input id="documentFile" name="documentFile" type="file" accept=".pdf,.txt,.docx" required />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardDescription>
              Browse and manage your uploaded reference materials.
            </CardDescription>
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search documents..." className="pl-8 sm:w-[300px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Size</TableHead>
                  <TableHead className="hidden md:table-cell">Uploaded On</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <Link href="#" className="hover:underline text-primary flex items-center gap-2" title="View document (placeholder)">
                        <FileText className="h-4 w-4 shrink-0" />
                        {doc.fileName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell uppercase text-xs">
                      {doc.fileType.split("/").pop()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => alert(`View ${doc.fileName} (placeholder)`)}>
                            <SearchIcon className="mr-2 h-4 w-4" /> View/Search Document
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => alert(`Download ${doc.fileName} (placeholder)`)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <form action={async () => {
                              "use server";
                              await deleteDocumentAction(doc.id);
                            }}
                            className="w-full"
                           >
                            <Button
                              type="submit"
                              variant="ghost"
                              className="w-full justify-start px-2 py-1.5 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              aria-label="Delete document"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Documents Uploaded</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your library is empty. Upload documents to get started.
              </p>
              <div className="mt-6">
                {/* Trigger file input or modal for upload */}
                <Button onClick={() => document.getElementById('documentFile')?.click()}>
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
