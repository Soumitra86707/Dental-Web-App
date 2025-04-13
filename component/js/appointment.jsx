import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import dayjs from "dayjs";

const useFetchAppointments = () => {
  const [appointmentsCount, setAppointmentsCount] = useState({ today: 0, total: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Appointments"),
      (snapshot) => {
        const allAppointments = snapshot.docs.map(doc => doc.data());

        // Filter only where userType is "patient"
        const patientAppointments = allAppointments.filter(
          (appointment) => appointment.userType === "patient"
        );

        const todayDate = dayjs().format("YYYY_MM_DD");

        const todayAppointments = patientAppointments.filter(
          (appointment) => appointment.appointment_date === todayDate
        );

        setAppointmentsCount({
          today: todayAppointments.length,
          total: patientAppointments.length,
        });
      },
      (error) => {
        console.error("Error fetching appointments:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return appointmentsCount;
};

export default useFetchAppointments;
