"use client";
import { auth } from "@/firebase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-[#0a0f1f] border-b border-white/10 shadow-md">
       <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
         {/* Logo / Title */}
         <h1 className="text-xl sm:text-2xl font-mono font-extrabold text-[--orange] tracking-wider drop-shadow-sm">
           Datathon Admin Portal
         </h1>
 
        <div className="flex items-center gap-4">
        <span className="text-sm text-[--foreground] font-mono hidden sm:block">
            {auth.currentUser?.email}
          </span>
          <button
            onClick={handleLogout}
            className="retro-button bg-gradient-to-r from-red-600 to-red-700 border-red-500 hover:from-red-700 hover:to-red-800"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
