
"use client";

import Link from "next/link";
import React, { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { uploadDocumentAction, deleteDocumentAction } from "../actions"; // Server Actions

interface LibraryManagementProps {
  initialDocuments: DocumentReference[];
}

export function LibraryManagement({ initialDocuments }: LibraryManagementProps) {
  const [documents, setDocuments] = useState<DocumentReference[]>(initialDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPendingUpload, startUploadTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("documentFile") as File;

    if (!file || file.size === 0) {
        toast({ title: "Upload Error", description: "Please select a file to upload.", variant: "destructive" });
        return;
    }

    startUploadTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (result.success) {
        toast({ title: "Upload Successful", description: result.message });
        // Optimistically update or rely on revalidation from server action
        // For demo, if server revalidates, no need to manually update state here.
        // Or, if an ID is returned, you could fetch the new document and add it.
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
        // Server action should revalidatePath, so new documents list will be fetched on next navigation or refresh.
        // To see immediate update without full state re-fetch, we could add to local state:
        // if (result.docId) {
        //    const newDoc = { id: result.docId, userId: 'user-123', fileName: file.name, fileType: file.type, fileSize: file.size, storagePath: '', uploadDate: new Date() };
        //    setDocuments(prev => [...prev, newDoc]);
        // }
      } else {
        toast({ title: "Upload Failed", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteDocument = async (docId: string) => {
    startDeleteTransition(async () => {
      const result = await deleteDocumentAction(docId);
      if (result.success) {
        toast({ title: "Delete Successful", description: result.message });
        setDocuments(docs => docs.filter(doc => doc.id !== docId)); // Optimistic update
      } else {
        toast({ title: "Delete Failed", description: result.message, variant: "destructive" });
      }
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
          <CardDescription>
            Add PDF, TXT, or DOCX files to your library. Max 100MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="documentFile">Select Document</Label>
              <Input id="documentFile" name="documentFile" type="file" accept=".pdf,.txt,.docx" ref={fileInputRef} />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPendingUpload}>
              {isPendingUpload ? <UploadCloud className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isPendingUpload ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardDescription>
              Browse and manage your uploaded reference materials.
            </CardDescription>
            <div className="relative w-full sm:w-auto">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-8 sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length > 0 ? (
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
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <Link href="#" className="hover:underline text-primary flex items-center gap-2" title="View document (placeholder)">
                        <FileText className="h-4 w-4 shrink-0" />
                        {doc.fileName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell uppercase text-xs">
                      {doc.fileType.split("/").pop()?.replace("vnd.openxmlformats-officedocument.wordprocessingml.", "")}
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
                          <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isPendingDelete}>
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
                           <DropdownMenuItem
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground"
                              disabled={isPendingDelete}
                            >
                              {isPendingDelete ? <Trash2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} 
                              Delete
                            </DropdownMenuItem>
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
              <h3 className="mt-2 text-xl font-semibold">No Documents Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "No documents match your search." : "Your library is empty. Upload documents to get started."}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
