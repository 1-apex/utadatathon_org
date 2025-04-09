"use client";
import { useState } from "react";
import QrReader from "@/app/components/QrReader";
import Modal from "@/app/components/Modal";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
interface ScannedData {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  schoolName: string;
}

export default function ScannerPage() {
  const [scannedData, setScannedData] = useState<ScannedData | null>();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async (id: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, "registrations", id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error("Participant not found");
      }
      
      setScannedData(docSnap.data() as ScannedData);
      setShowModal(true);
    } catch (err) {
      setError(`Error scanning QR code or insufficient permissions, ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = async (eventKey: string) => {
    if (!scannedData?.userId) return;
    
    try {
      const userRef = doc(db, "registrations", scannedData.userId);
      await updateDoc(userRef, {
        [`events.${eventKey}`]: true,
        [`events.${eventKey}_timestamp`]: new Date()
      });
      setShowModal(false);
    } catch (err) {
      setError(`Failed to update participant record, ${err}`);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p>Processing scan...</p>}
      
      <QrReader onScan={handleScan} />
      
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        userData={scannedData || {} as ScannedData}
        onRegister={handleEventRegistration}
      />
    </div>
  );
}
