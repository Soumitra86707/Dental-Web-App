import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

const UseFetchPatientGrowth = () => {
    const [patientGrowth, setPatientGrowth] = useState({ prevMonth: 0, currentMonth: 0, growthRate: 0 });

    useEffect(() => {
        const fetchPatientRecords = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "prescriptions"));
                const records = querySnapshot.docs.map(doc => doc.data());

                // Get last month's and this month's dates
                const currentMonth = dayjs().format("YYYY_MM");
                const prevMonth = dayjs().subtract(1, "month").format("YYYY_MM");

                // Count patient records for each month
                let currentMonthCount = 0;
                let prevMonthCount = 0;

                records.forEach(({ createdAt }) => {
                    if (createdAt.startsWith(currentMonth)) {
                        currentMonthCount++;
                    } else if (createdAt.startsWith(prevMonth)) {
                        prevMonthCount++;
                    }
                });

            

                // Calculate growth rate correctly
                let growthRate = prevMonthCount > 0 
                    ? ((currentMonthCount - prevMonthCount) / prevMonthCount) * 100 
                    : currentMonthCount > 0 ? 100 : 0;
               
                setPatientGrowth({ prevMonth: prevMonthCount, currentMonth: currentMonthCount, growthRate });
            } catch (error) {
                console.error("Error fetching previous month's patient records:", error);
            }
        };

        fetchPatientRecords();
    }, []);

    return patientGrowth;
};

export default UseFetchPatientGrowth;
