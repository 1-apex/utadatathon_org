"use client";
import { auth } from "@/firebase";
import { redirect } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import Navbar from "@/app/components/Navbar";

const adminEmails = [
  "pratham153patil@gmail.com",
  "thesamarthjagtap@gmail.com",
  "linkwithsujit@gmail.com",
  "satya.rallabandi7@gmail.com"
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user || !adminEmails.includes(user.email!)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0A1A33]">
      <Navbar />
      <main className="">{children}</main>
    </div>
  );
}
