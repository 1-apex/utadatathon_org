"use client";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

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
  "ramialet02@gmail.com",
  "devratasauthor@gmail.com",
  "isitthakkar1@gmail.com",
  "karanthakkar2002@gmail.com"

];

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!adminEmails.includes(email!)) {
        await auth.signOut();
        setError("Access restricted to authorized organizers only.");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(`Failed to log in. Please try again. ${err}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="bg-[#161b22] p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Organizer Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-500 text-white font-semibold p-2 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
