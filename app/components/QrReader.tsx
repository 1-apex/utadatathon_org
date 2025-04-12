"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrReader({
  onScan,
}: {
  onScan: (data: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);


  useEffect(() => {
    const initCamera = async () => {
      setIsLoading(true);
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");

        if (videoInputs.length === 0) {
          throw new Error("No video devices found.");
        }

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } },
          });
        } catch (err) {
          console.warn("Rear camera not found, falling back to default:", err);
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        mediaStreamRef.current = stream;
        html5QrRef.current = new Html5Qrcode("qr-reader-placeholder");

        // Start QR scanning
        await html5QrRef.current.start(
          videoRef.current!,
          { fps: 10, qrbox: 250 },
          onScan,
          (error) => console.error("QR scan error:", error)
        );
      } catch (err) {
        console.error("Camera error:", err);
        setError(
          "Unable to access camera. Please check permissions or use file upload."
        );
      } finally {
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  const captureAndScan = async () => {
    setError(null);
    if (!videoRef.current || !canvasRef.current || !html5QrRef.current) {
      setError("Unable to capture video or initialize QR code scanner.");
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Failed to get canvas context.");
      return;
    }

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("Failed to capture image from video.");
        return;
      }

      const file = new File([blob], "frame.jpg", { type: "image/jpeg" });

      try {
        const result = await html5QrRef.current!.scanFile(file, true);
        onScan(result);
      } catch (err) {
        console.error("QR scan error:", err);
        setError("No QR code detected. Try again with a clearer view.");
      }
    }, "image/jpeg");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files?.length || !html5QrRef.current) {
      setError("No file selected or QR code scanner is not initialized.");
      return;
    }

    const file = e.target.files[0];

    try {
      const result = await html5QrRef.current.scanFile(file, true);
      onScan(result);
    } catch (err) {
      console.error("QR scan error:", err);
      setError("No QR code found in the uploaded file. Please try another.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-black shadow-md">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold bg-black/70">
            Loading camera...
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
        <button
          onClick={captureAndScan}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
        >
          Capture & Scan
        </button>

        <label className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg cursor-pointer transition">
          Upload QR
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-500 text-center">{error}</div>
      )}

      <div id="qr-reader-placeholder" className="hidden" />
    </div>
  );
}