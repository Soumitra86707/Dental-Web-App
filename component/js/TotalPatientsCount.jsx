import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const useFetchPatientAndTreatmentData = () => {
  const [data, setData] = useState({ totalPatients: 0, totalTreatments: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total patients count
        const patientsSnapshot = await getDocs(collection(db, "Patient"));
        const totalPatients = patientsSnapshot.size;

        // Fetch total treatments count from Prescription table
        const prescriptionSnapshot = await getDocs(collection(db, "prescriptions"));
        const totalTreatments = prescriptionSnapshot.size;

        /* const consultantsSnapshot = await getDocs(collection(db, "consultants"));
        const totalconsultants = consultantsSnapshot.size; */

        // Update state with fetched data
        setData({ totalPatients, totalTreatments});
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return data;
};

export default useFetchPatientAndTreatmentData;
