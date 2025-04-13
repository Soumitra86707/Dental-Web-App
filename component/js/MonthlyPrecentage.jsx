import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import dayjs from "dayjs";

const useFetchMonthlyGrowth = () => {
    const [growth, setGrowth] = useState({ lastMonth: 0, thisMonth: 0, growthPercentage: 0 });

    useEffect(() => {
        const fetchAppointments = () => {
            // Get last month's and this month's date ranges
            const thisMonth = dayjs().format("YYYY_MM");
            const lastMonth = dayjs().subtract(1, "month").format("YYYY_MM");

            // Real-time listener to fetch all appointments
            const unsubscribe = onSnapshot(collection(db, "Appointments"), (snapshot) => {
                const appointments = snapshot.docs.map(doc => doc.data());

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
            });

            // Cleanup listener when the component is unmounted
            return () => unsubscribe();
        };

        fetchAppointments();
    }, []);

    return growth;
};

export default useFetchMonthlyGrowth;
