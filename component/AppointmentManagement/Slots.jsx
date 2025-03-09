import { useEffect, useState } from "react";
import { db } from "../Config/FirebaseConfig"; // Update path as needed
import { collection, getDocs } from "firebase/firestore";

const FetchSlots = ({ onSlotsFetched }) => {
    useEffect(() => {
      const fetchAppointmentSlots = async () => {
        try {
          const slotsCollectionRef = collection(db, "Forms", "patient", "Appointment Slots");
          const querySnapshot = await getDocs(slotsCollectionRef);
  
          const fetchedSlots = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              slot_no: data.slot_no ? Number(data.slot_no) : null, // Ensure slot_no is a number
              slot_start_time: data.slot_start_time || "",
              slot_end_time: data.slot_end_time || "",
            };
          });
  
          onSlotsFetched(fetchedSlots); // Send data to parent component
        } catch (error) {
          console.error("Error fetching slots:", error);
        }
      };
  
      fetchAppointmentSlots();
    }, []); // Removed `onSlotsFetched` to avoid unnecessary re-renders
  
    return null; // No UI needed
  };
  
  export default FetchSlots;