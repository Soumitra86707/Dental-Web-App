import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

const useFetchMonthlyGrowth = () => {
    const [growth, setGrowth] = useState({ lastMonth: 0, thisMonth: 0, growthPercentage: 0 });

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "Appointments"));
                const appointments = querySnapshot.docs.map(doc => doc.data());

                // Get last month's and this month's dates
                const thisMonth = dayjs().format("YYYY_MM");
                const lastMonth = dayjs().subtract(1, "month").format("YYYY_MM");

                // Count appointments for each month
                let thisMonthCount = 0;
                let lastMonthCount = 0;

                appointments.forEach(({ appointment_date }) => {
                    if (appointment_date.startsWith(thisMonth)) {
                        thisMonthCount++;
                    } else if (appointment_date.startsWith(lastMonth)) {
                        lastMonthCount++;
                    }
                });


                // Calculate growth percentage
                let growthPercentage = lastMonthCount > 0 
                    ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 
                    : thisMonthCount > 0 ? 100 : 0;

                setGrowth({ lastMonth: lastMonthCount, thisMonth: thisMonthCount, growthPercentage });
            } catch (error) {
                console.error("Error fetching appointments:", error);
            }
        };

        fetchAppointments();
    }, []);

    return growth;
};

export default useFetchMonthlyGrowth;
