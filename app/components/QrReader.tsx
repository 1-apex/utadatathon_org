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
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const toggleCamera = async () => {
    if (!html5QrRef.current) return;
  
    setIsLoading(true);
    setError(null);
  
    try {
      await html5QrRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
      if (isIOS) {
        // iOS can't enumerate device IDs properly — use facingMode flip
        const newFacingMode =
          currentDeviceId === "environment" ? "user" : "environment";
  
        html5QrRef.current = new Html5Qrcode("qr-reader-placeholder");
        await html5QrRef.current.start(
          { facingMode: newFacingMode },
          { fps: 10, qrbox: 250 },
          onScan,
          (err) => console.error("QR scan error", err)
        );
  
        setCurrentDeviceId(newFacingMode);
      } else {
        // Android / Desktop – toggle by device ID
        const currentIndex = videoDevices.findIndex(
          (device) => device.deviceId === currentDeviceId
        );
        const nextIndex = (currentIndex + 1) % videoDevices.length;
        const nextDeviceId = videoDevices[nextIndex].deviceId;
  
        html5QrRef.current = new Html5Qrcode("qr-reader-placeholder");
        await html5QrRef.current.start(
          { deviceId: { exact: nextDeviceId } },
          { fps: 10, qrbox: 250 },
          onScan,
          (err) => console.error("QR scan error", err)
        );
  
        setCurrentDeviceId(nextDeviceId);
      }
    } catch (err) {
      console.error("Camera toggle failed", err);
      setError("Unable to switch camera.");
    } finally {
      setIsLoading(false);
    }
  };  

  useEffect(() => {
    const initCamera = async () => {
      setIsLoading(true);
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);

        if (videoInputs.length === 0) {
          throw new Error("No video devices found.");
        }

        let selectedDeviceId = videoInputs[0].deviceId;
        for (const device of videoInputs) {
          if (device.label.toLowerCase().includes("back")) {
            selectedDeviceId = device.deviceId;
            break;
          }
        }

        setCurrentDeviceId(selectedDeviceId);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
        });

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        html5QrRef.current = new Html5Qrcode("qr-reader-placeholder");

        await html5QrRef.current.start(
          { deviceId: { exact: selectedDeviceId } },
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
      setError("No file selected or QR code scanner not initialized.");
      return;
    }

    const file = e.target.files[0];

    try {
      const result = await html5QrRef.current.scanFile(file, true);
      onScan(result);
    } catch (err) {
      console.error("QR scan error:", err);
      setError("No QR code found in uploaded file.");
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center p-4">
      <div id="qr-reader-placeholder" className="hidden" />

      <video
        ref={videoRef}
        className="rounded shadow-md max-w-full w-[360px] h-[270px] bg-black"
        autoPlay
        muted
        playsInline
      />

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-red-500">{error}</p>}
      {isLoading && <p className="text-gray-500">Initializing camera...</p>}

      <div className="flex gap-2 mt-2">
        {videoDevices.length > 1 && (
          <button
            onClick={toggleCamera}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
          >
            Switch Camera
          </button>
        )}
        <button
          onClick={captureAndScan}
          className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
        >
          Scan Frame
        </button>
        <label className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-md shadow hover:bg-gray-700 transition">
          Upload Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
}
