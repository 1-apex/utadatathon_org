"use client";

import { useState, useRef } from "react";
import QrReader from "@/app/components/QrReader";
import Modal from "@/app/components/Modal";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [linkingMode, setLinkingMode] = useState(false);
  const [randomQrCode, setRandomQrCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const events = [
    {
      id: "event-1",
      name: "Registration & Check-in",
    },
    {
      id: "event-2",
      name: "T-shirts",
    },
    {
      id: "event-4",
      name: "Lunch",
    },
    {
      id: "event-17",
      name: "Workshop #3"
    },
    {
      id: "event-5",
      name: "Workshop #1",
    },
    {
      id: "event-6",
      name: "Workshop #2 (MLH)",
    },
    {
      id: "event-7",
      name: "Dr. Behzad Workshop - Data Diversity in ML",
    },
    {
      id: "event-8",
      name: "Snacks",
    },
    {
      id: "event-10",
      name: "Dinner",
    },
    {
      id: "event-12",
      name: "Late Night Coffee",
    },
    {
      id: "event-14",
      name: "Breakfast",
    },
    {
      id: "event-16",
      name: "Lunch",
    },
  ];

  const lastScannedIdRef = useRef<string | null>(null);

  const handleScan = async (id: string) => {
    if (!id) {
      setError("Invalid QR code. Please try again.");
      return;
    }

    // console.log("Scanned ID:", id);

    if (!user) {
      setError("Authentication required.");
      return;
    }

    if (loading || id === lastScannedIdRef.current) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (linkingMode) {
        // Linking mode: Scan random QR first, then user QR
        if (!randomQrCode) {
          const existingQrRef = doc(db, "qr-links", id.trim());
          const existingQrSnap = await getDoc(existingQrRef);

          // Check if the QR code is already linked to a user
          if (existingQrSnap.exists()) {
            throw new Error("This QR code is already linked to a user.");
          }
          setRandomQrCode(id);
          setSuccessMessage("Random QR scanned. Now scan user QR.");
        } else {
          // Save mapping in qr-links collection
          const qrRef = doc(db, "qr-links", randomQrCode.trim());
          await setDoc(qrRef, { userDocId: id.trim() });

          setSuccessMessage(`QR ${randomQrCode} linked to user ${id}`);
          resetLinkingMode();
        }
      } else {
        // Normal scan operation
        const qrRef = doc(db, "qr-links", id.trim());
        const qrSnap = await getDoc(qrRef);
        let userDocId: string;
        let userRef;

        if (qrSnap.exists()) {
          userDocId = qrSnap.data().userDocId;
          userRef = doc(db, "registrations", userDocId);
        }
        else{
          throw new Error("Scan the gameboy QR!! If not contact DEV team!");
        }

        // ----------------------------------------------------------------------------------------------------
        // remove this comment if you want to use direct scanning user QR codes for event registration
        // if (qrSnap.exists()) {
        //   userDocId = qrSnap.data().userDocId;
        //   userRef = doc(db, "registrations", userDocId);
        // } else {
        //   userDocId = id.trim();
        //   userRef = doc(db, "registrations", userDocId);
        // }
        // ----------------------------------------------------------------------------------------------------

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error("Participant not found.");
        }

        const data = userSnap.data() as ScannedData;
        setUserId(userDocId);
        setScannedData(data);
        lastScannedIdRef.current = id;
        setShowModal(true);
      }
    } catch (err) {
      setError("Error scanning QR: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetLinkingMode = () => {
    setLinkingMode(false);
    setRandomQrCode(null);
  };

  const handleEventRegistration = async (eventKey: string) => {
    if (!userId || !user) return;

    setRegistrationLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const userRef = doc(db, "registrations", userId);
      await updateDoc(userRef, {
        [`events.${eventKey}`]: true,
      });

      const eventName = events.find((e) => e.id === eventKey)?.name || "Event";
      setSuccessMessage(
        `${scannedData?.firstname} registered for ${eventName}`
      );
      setShowModal(false);
      setScannedData(null);
      setUserId(null);
      lastScannedIdRef.current = null;
    } catch (err) {
      setError("Registration failed: " + (err as Error).message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#0A1A33]">
      {/* <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1> */}

      {/* Status Messages */}
      {error && <div className="status status-error">{error}</div>}
       {successMessage && <div className="status status-success">{successMessage}</div>}
       {loading && <div className="status status-loading">Processing...</div>}
       {registrationLoading && <div className="status status-loading">Registering...</div>}

      {/* Scanner Interface */}
      <div className="glass-card">
         <QrReader onScan={handleScan} />
       </div>

      {/* Control Buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
       <button
   className={`retro-button ${linkingMode ? "opacity-50 cursor-not-allowed" : ""}`}
   disabled={linkingMode}
   onClick={() => {
     resetLinkingMode();
     setSuccessMessage("Scanning mode: Event Registration");
   }}
 >
   Scan for Events
 </button>
 
 <button
   className="retro-button"
   onClick={() => {
     setLinkingMode(true);
     setSuccessMessage("Linking mode: Scan random QR first");
   }}
 >
   Link QR
 </button>
 
 <Modal
   open={showModal}
   onClose={() => setShowModal(false)}
   userData={scannedData || {
     firstname: "",
     lastname: "",
     email: "",
     schoolName: "",
   }}
   onRegister={handleEventRegistration}
 />
       </div>
      {/* Registration Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        userData={scannedData || ({} as ScannedData)}
        onRegister={handleEventRegistration}
      />
    </div>
  );
}
