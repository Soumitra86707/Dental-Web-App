import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const useFetchPatientAndTreatmentData = () => {
  const [data, setData] = useState({ totalPatients: 0, totalTreatments: 0 });

  useEffect(() => {
    const unsubscribePatients = onSnapshot(collection(db, "Patient"), (patientsSnapshot) => {
      const totalPatients = patientsSnapshot.size;

      const unsubscribePrescriptions = onSnapshot(collection(db, "prescriptions"), (prescriptionSnapshot) => {
        const totalTreatments = prescriptionSnapshot.size;

        // Update state with fetched data
        setData({ totalPatients, totalTreatments });
      });

      // Cleanup subscriptions when component unmounts
      return () => {
        unsubscribePatients();
        unsubscribePrescriptions();
      };
    });
  }, []);

  return data;
};

export default useFetchPatientAndTreatmentData;
