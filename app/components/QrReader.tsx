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
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        if (videoDevices.length === 0) {
          throw new Error("No video devices found.");
        }

        // const stream = await navigator.mediaDevices.getUserMedia({
        //   video: videoDevices[0]?.deviceId
        //     ? { facingMode: { exact: "environment" } }
        //     : { deviceId: videoDevices[0].deviceId },
        // });
        const constraints = {
          video: {
            facingMode: "environment", 
          },
        };

        let stream;
        try {
          // Try rear camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } },
          });
        } catch (err) {
          console.warn("Rear camera not found, falling back to default:", err);
          // Fallback to default camera
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        mediaStreamRef.current = stream;

        html5QrRef.current = new Html5Qrcode("qr-reader-placeholder");
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
      // Cleanup: Stop the media stream and QR code scanner when the component is unmounted
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  const captureAndScan = async () => {
    setError(null); // Reset error state
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
        if (!html5QrRef.current) {
          setError("QR code scanner is not initialized.");
          return;
        }
        const result = await html5QrRef.current.scanFile(file, true);
        onScan(result);
      } catch (err) {
        console.error("QR scan error:", err);
        setError("No QR code detected. Try again with a clearer view.");
      }
    }, "image/jpeg");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Reset error state
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
      {/* Video Feed */}
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

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
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

      {/* Error Message */}
      {error && (
        <div className="mt-3 text-sm text-red-500 text-center">{error}</div>
      )}

      {/* Dummy div to prevent Html5Qrcode error */}
      <div id="qr-reader-placeholder" className="hidden" />
    </div>
  );
}
