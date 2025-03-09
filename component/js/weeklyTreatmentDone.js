import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig"; // Import Firebase config
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs"; // For date formatting

const useFetchWeeklyTreatmentDone = () => {
    const [weeklyData, setWeeklyData] = useState([]);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "prescriptions"));
                const appointments = querySnapshot.docs.map(doc => doc.data());

                // Map weekday names for the last 7 days
                const weekDaysMap = {};
                [...Array(7)].forEach((_, i) => {
                    const date = dayjs().subtract(i, "day").format("YYYY_MM_DD");
                    const dayName = dayjs().subtract(i, "day").format("dddd"); // ✅ Fixed
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
            } catch (error) {
                console.error("Error fetching appointments:", error);
            }
        };

        fetchAppointments();
    }, []);

    return weeklyData;
};

export default useFetchWeeklyTreatmentDone;
