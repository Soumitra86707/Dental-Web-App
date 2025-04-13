import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig"; // Import Firebase config
import { collection, onSnapshot } from "firebase/firestore"; // Import onSnapshot
import dayjs from "dayjs"; // For date formatting

const useFetchWeeklyTreatmentDone = () => {
    const [weeklyData, setWeeklyData] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "prescriptions"), (querySnapshot) => {
            const appointments = querySnapshot.docs.map(doc => doc.data());

            // Map weekday names for the last 7 days
            const weekDaysMap = {};
            [...Array(7)].forEach((_, i) => {
                const date = dayjs().subtract(i, "day").format("YYYY_MM_DD");
                const dayName = dayjs().subtract(i, "day").format("dddd");
                weekDaysMap[date] = { x: dayName, y: 0 };
            });

            // Count appointments for each day
            appointments.forEach(({ createdAt }) => {
                if (weekDaysMap[createdAt]) {
                    weekDaysMap[createdAt].y += 1;
                }
            });

            // Convert object to array & sort by date order
            setWeeklyData(Object.values(weekDaysMap).reverse());
        });

        // Cleanup listener when component unmounts
        return () => unsubscribe();
    }, []);

    return weeklyData;
};

export default useFetchWeeklyTreatmentDone;
