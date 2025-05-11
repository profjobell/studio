"use server";

import type { DocumentReference } from "@/types"; // Assuming DocumentReference type is defined
import { revalidatePath } from "next/cache";

// Placeholder for actual Firestore and Cloud Storage operations
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

// Temporary in-memory store for documents for demo purposes
let tempLibraryDB: DocumentReference[] = [
  {
    id: "doc-001",
    userId: "user-123", // Placeholder user ID
    fileName: "Systematic_Theology_Grudem.pdf",
    fileType: "application/pdf",
    fileSize: 5242880, // 5MB
    storagePath: "/documents/user-123/Systematic_Theology_Grudem.pdf", // Simulated
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
];


export async function fetchLibraryDocuments(): Promise<DocumentReference[]> {
  // Simulate fetching documents
  console.log("Server Action: Fetching library documents (simulated)");
  return Promise.resolve(tempLibraryDB);
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

  console.log(`Server Action: Uploading document: ${file.name}, Size: ${file.size}, Type: ${file.type} (simulated)`);
  
  // Simulate upload to Cloud Storage and creating Firestore record
  const newDocId = `doc-${Date.now()}`;
  const newDocument: DocumentReference = {
    id: newDocId,
    userId: "user-123", // Placeholder for actual authenticated user ID
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    storagePath: `/documents/user-123/${file.name}`, // Simulated path
    uploadDate: new Date(),
  };
  tempLibraryDB.push(newDocument);

  revalidatePath("/library"); // Revalidate the library page to show the new document
  return { success: true, message: `Document "${file.name}" uploaded successfully.`, docId: newDocId };
}

export async function deleteDocumentAction(docId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Server Action: Attempting to delete document: ${docId} (simulated)`);
  
  const initialLength = tempLibraryDB.length;
  tempLibraryDB = tempLibraryDB.filter(doc => doc.id !== docId);

  if (tempLibraryDB.length < initialLength) {
    revalidatePath("/library"); // Revalidate the library page
    return { success: true, message: `Document ${docId} deleted successfully.` };
  } else {
    return { success: false, message: `Document ${docId} not found or could not be deleted.` };
  }
}
