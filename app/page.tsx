"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  return <div className="p-4">Loading...</div>;
}
