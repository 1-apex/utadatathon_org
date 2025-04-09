"use client";
import { useState } from "react";

interface UserData {
  firstname: string;
  lastname: string;
  email: string;
  schoolName: string;
}

export default function Modal({
  open,
  onClose,
  userData,
  onRegister
}: {
  open: boolean;
  onClose: () => void;
  userData: UserData;
  onRegister: (eventKey: string) => void;
}) {
  const [selectedEvent, setSelectedEvent] = useState("event-1");
  const events = [
    { id: "event-1", name: "Opening Ceremony" },
    { id: "event-2", name: "Workshop Session" },
    { id: "event-3", name: "Hacking Time" },
    { id: "event-4", name: "Judging Round" },
    { id: "event-5", name: "Closing Ceremony" }
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Participant Details</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {userData?.firstname} {userData?.lastname}</p>
          <p><strong>Email:</strong> {userData?.email}</p>
          <p><strong>School:</strong> {userData?.schoolName}</p>
        </div>
        
        <div className="mt-4">
          <label className="block mb-2">Select Event</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onRegister(selectedEvent)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Register Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
