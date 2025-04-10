"use client";
import { useState, useRef } from "react";
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
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const lastScannedIdRef = useRef<string | null>(null);

  const handleScan = async (id: string) => {
    if (!id) {
      setError("Invalid QR code. Please try again.");
      return;
    }

    console.log("id : ", id);
  
    if (!user) {
      setError("Authentication required");
      return;
    }
  
    if (loading || id === lastScannedIdRef.current) return;
  
    setLoading(true);
    setError("");
    setSuccessMessage("");
  
    try {
      const docRef = doc(db, "registrations", id.trim());
      console.log("docRef:", docRef);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) {
        throw new Error("Participant not found");
      }
  
      const data = docSnap.data() as ScannedData;
      setScannedData(data);
      lastScannedIdRef.current = id;
      setShowModal(true);
    } catch (err) {
      setError("Error scanning QR code: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = async (eventKey: string) => {
    if (!scannedData?.userId || !user) {
      console.warn("Missing scanned data or user not authenticated.");
      return;
    }

    setRegistrationLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const userRef = doc(db, "registrations", scannedData.userId);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        throw new Error(`No registration record found for user ID: ${scannedData.userId}`);
      }

      await updateDoc(userRef, {
        [`events.${eventKey}`]: true,
        [`events.${eventKey}_timestamp`]: new Date().toISOString(),
      });

      setSuccessMessage(`User ${scannedData.firstname} successfully registered for event: ${eventKey}`);
      setShowModal(false);
      setScannedData(null);
      lastScannedIdRef.current = null;
    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : String(err);
      console.error("Error updating registration:", errorMessage);
      setError("Failed to update participant record: " + errorMessage);
    } finally {
      setRegistrationLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {error && <div className="bg-red-100 p-4 rounded mb-4 text-red-700">{error}</div>}
      {successMessage && <div className="bg-green-100 p-4 rounded mb-4 text-green-700">{successMessage}</div>}
      {loading && <div className="p-4 bg-blue-100 rounded mb-4">Processing scan...</div>}
      {registrationLoading && <div className="p-4 bg-blue-100 rounded mb-4">Registering user...</div>}

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
