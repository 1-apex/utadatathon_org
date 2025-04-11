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
      name: "Opening Ceremony",
    },
    {
      id: "event-3",
      name: "Hacking Begins",
    },
    {
      id: "event-4",
      name: "Lunch",
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
      id: "event-9",
      name: "Workshop #4",
    },
    {
      id: "event-10",
      name: "Mini-Event: Hungry Hungry Hippos",
    },
    {
      id: "event-11",
      name: "Dinner",
    },
    {
      id: "event-12",
      name: "Mini-Event: Scribbl.io",
    },
    {
      id: "event-13",
      name: "Late Night Coffee",
    },
    {
      id: "event-14",
      name: "Mini-Event: Late Night Among Us",
    },
    {
      id: "event-15",
      name: "Breakfast",
    },
    {
      id: "event-16",
      name: "Hacking Ends & Judging Begins",
    },
    {
      id: "event-17",
      name: "Lunch",
    },
    {
      id: "event-18",
      name: "Mini-Event: Bingo",
    },
    {
      id: "event-19",
      name: "Closing Ceremony",
    }
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

        if (!qrSnap.exists()) {
          throw new Error("QR code not registered.");
        }

        const userDocId = qrSnap.data().userDocId;
        const userRef = doc(db, "registrations", userDocId);
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 p-4 rounded mb-4 text-red-700">{error}</div>
      )}
      {successMessage && (
        <div className="bg-green-100 p-4 rounded mb-4 text-green-700">
          {successMessage}
        </div>
      )}
      {loading && (
        <div className="p-4 bg-blue-100 rounded mb-4">Processing...</div>
      )}
      {registrationLoading && (
        <div className="p-4 bg-blue-100 rounded mb-4">Registering...</div>
      )}

      {/* Scanner Interface */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <QrReader onScan={handleScan} />
      </div>

      {/* Control Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded ${
            linkingMode
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          disabled={linkingMode}
          onClick={() => {
            resetLinkingMode();
            setSuccessMessage("Scanning mode: Event Registration");
          }}
        >
          Scan for Events
        </button>

        <button
          className={`px-4 py-2 rounded ${
            linkingMode
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
          onClick={() => {
            setLinkingMode(true);
            setSuccessMessage("Linking mode: Scan random QR first");
          }}
        >
          {linkingMode ? "Linking Mode Active" : "Link New QR"}
        </button>
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
