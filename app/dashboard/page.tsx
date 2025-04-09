"use client";
import { useState } from "react";
import QrReader from "@/app/components/QrReader";
import Modal from "@/app/components/Modal";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface ScannedData {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  schoolName: string;
}

export default function ScannerPage() {
  const [user] = useAuthState(auth);
  const [userId, setUserId] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedData | null>();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async (id: string) => {
    if (!user) {
      setError("Authentication required");
      return;
    }
    
    setLoading(true);
    try {
      const docRef = doc(db, "registrations", id);  // Use the documentId from QR code here
      setUserId(id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error("Participant not found");
      }
      
      setScannedData(docSnap.data() as ScannedData);
      setShowModal(true);
    } catch (err) {
      setError("Error scanning QR code: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const handleEventRegistration = async (eventKey: string) => {
    if (!scannedData?.userId || !user) return;
  


    try {
      if (!userId) {
        throw new Error("User ID is null");
      }
      const userRef = doc(db, "registrations", userId);
      const docSnap = await getDoc(userRef);
  
      if (!docSnap.exists()) {
        throw new Error("No document found for this user.");
      }
  
      console.log("Document data:", docSnap.data()); // Log the document data for debugging
  
      await updateDoc(userRef, {
        [`events.${eventKey}`]: true,
        [`events.${eventKey}_timestamp`]: new Date(),
      });
  
      setShowModal(false);
  
    } catch (err) {
      setError("Failed to update participant record: " + (err as Error).message);
    }
  };
  
  

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>
      {error && <div className="bg-red-100 p-4 rounded mb-4 text-red-700">{error}</div>}
      {loading && <div className="p-4 bg-blue-100 rounded">Processing scan...</div>}
      
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <QrReader onScan={handleScan} />
      </div>
      
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        userData={scannedData || {} as ScannedData}
        onRegister={handleEventRegistration}
      />
    </div>
  );
}
