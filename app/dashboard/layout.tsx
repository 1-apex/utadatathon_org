"use client";
import { auth } from "@/firebase";
import { redirect } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import Navbar from "@/app/components/Navbar";

const adminEmails = [
  "pratham153patil@gmail.com",
  "thesamarthjagtap@gmail.com",
  "linkwithsujit@gmail.com",
  "satya.rallabandi7@gmail.com",
  "rr1shahzad@gmail.com",
  "zecilyjain2000@gmail.com",
  "abhijitchallaplli99@gmail.com",
  "clivin100@gmail.com",
  "desair2003@gmail.com",
  "akhilcherukuri54@gmail.com",
  "lamia.rodoshi95@gmail.com",
  "saitejar35@gmail.com",
  "araohatk@gmail.com",
  "pradeepsinhchavda1672@gmail.com",
  "aastha6100@gmail.com",
  "pranachilukuri22@gmail.com",
  "kanishkaabharti@gmail.com",
  "ramialet02@gmail.com"
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="">{children}</main>
    </div>
  );
}
