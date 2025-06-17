
"use server";

import type { DocumentReference } from "@/types"; // Assuming DocumentReference type is defined
import { revalidatePath } from "next/cache";

// Placeholder for actual Firestore and Cloud Storage operations
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

// Temporary in-memory store for documents for demo purposes
// Ensure tempLibraryDB survives hot-reloads in dev by attaching to global
declare global {
  // eslint-disable-next-line no-var
  var tempLibraryDatabaseGlobal: DocumentReference[] | undefined;
}

let tempLibraryDB: DocumentReference[];

if (process.env.NODE_ENV === 'production') {
  tempLibraryDB = [];
} else {
  if (!global.tempLibraryDatabaseGlobal) {
    global.tempLibraryDatabaseGlobal = [];
    // You can pre-populate with sample data for development if needed, for example:
    // global.tempLibraryDatabaseGlobal.push({ 
    //   id: 'sample-doc-dev-1', 
    //   userId: 'dev-user', 
    //   fileName: 'Sample Dev Document.pdf', 
    //   fileType: 'application/pdf', 
    //   fileSize: 102400, // 100KB
    //   storagePath: '/dev/sample-doc.pdf', 
    //   uploadDate: new Date() 
    // });
  }
  tempLibraryDB = global.tempLibraryDatabaseGlobal;
}


export async function fetchLibraryDocuments(): Promise<DocumentReference[]> {
  // Ensure tempLibraryDB is always an array, even if global somehow fails (defensive programming)
  return Promise.resolve(Array.isArray(tempLibraryDB) ? [...tempLibraryDB].sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()) : []);
}

export async function uploadDocumentAction(formData: FormData): Promise<{ success: boolean; message: string; docId?: string }> {
  const file = formData.get("documentFile") as File;

  if (!file || file.size === 0) {
    return { success: false, message: "No file provided or file is empty." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, message: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB.` };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { success: false, message: "Invalid file type. Allowed: PDF, TXT, DOCX." };
  }
  
  const newDocId = `doc-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
  const newDocument: DocumentReference = {
    id: newDocId,
    userId: "user-123", // Placeholder for actual authenticated user ID
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    storagePath: `/documents/user-123/${newDocId}-${file.name}`, // Simulated path
    uploadDate: new Date(),
  };
  
  if (!Array.isArray(tempLibraryDB)) {
    tempLibraryDB = []; 
  }
  tempLibraryDB.push(newDocument);

  revalidatePath("/library"); 
  revalidatePath("/dashboard"); 
  return { success: true, message: `Document "${file.name}" uploaded successfully.`, docId: newDocId };
}

export async function deleteDocumentAction(docId: string): Promise<{ success: boolean; message: string }> {
  if (!Array.isArray(tempLibraryDB)) {
    return { success: false, message: `Document ${docId} not found or internal error.` };
  }

  const initialLength = tempLibraryDB.length;
  tempLibraryDB = tempLibraryDB.filter(doc => doc.id !== docId);

  if (tempLibraryDB.length < initialLength) {
    revalidatePath("/library"); 
    revalidatePath("/dashboard");
    return { success: true, message: `Document ${docId} deleted successfully.` };
  } else {
    return { success: false, message: `Document ${docId} not found or could not be deleted.` };
  }
}

export async function deleteAllDocumentsAction(): Promise<{ success: boolean; message: string }> {
  if (!Array.isArray(tempLibraryDB)) {
    tempLibraryDB = []; // Ensure it's an array
  }
  
  if (tempLibraryDB.length === 0) {
    return { success: true, message: "Document library is already empty." };
  }

  const numDeleted = tempLibraryDB.length;
  tempLibraryDB = []; // Clear the array

  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { success: true, message: `Successfully deleted ${numDeleted} document(s).` };
}

