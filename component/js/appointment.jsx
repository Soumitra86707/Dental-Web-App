import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig"; // Import your Firebase config
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs"; // To format dates properly

const useFetchAppointments = () => {
  const [appointmentsCount, setAppointmentsCount] = useState({ today: 0, total: 0 });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Appointments"));
        const appointments = querySnapshot.docs.map(doc => doc.data());

        const todayDate = dayjs().format("YYYY_MM_DD"); // Convert today's date to "YYYY_MM_DD" format

        const todayAppointments = appointments.filter((appointment) => {
          let appointmentDate = appointment.appointment_date; // Ensure correct field name

          return appointmentDate === todayDate; // Compare with formatted today's date
        });

        setAppointmentsCount({
          today: todayAppointments.length,
          total: appointments.length,
        });
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments();
  }, []);

  return appointmentsCount;
};

export default useFetchAppointments;
