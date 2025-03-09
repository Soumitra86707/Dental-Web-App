import { collection, query, where, getDocs } from "firebase/firestore";
import moment from "moment";
import { db } from "../../Config/FirebaseConfig"; // Adjust based on your structure

export const fetchPatientsData = async (viewMode) => {
    console.log("fetchPatientsData:", viewMode);
  try {
    const now = moment();
    let startDate, timeUnits, categories = [];

    if (viewMode === "daily") {
      startDate = now.clone().subtract(6, "days").startOf("day");
      timeUnits = 7;
      categories = Array.from({ length: timeUnits }, (_, i) =>
        now.clone().subtract(i, "days").format("DD MMM")
      ).reverse();
    } else if (viewMode === "monthly") {
      startDate = now.clone().subtract(1, "months").startOf("month");
      timeUnits = now.daysInMonth();
      categories = Array.from({ length: timeUnits }, (_, i) =>
        now.clone().subtract(i, "days").format("DD MMM")
      ).reverse();
    } else if (viewMode === "sixMonths") {
      startDate = now.clone().subtract(5, "months").startOf("month");
      timeUnits = 6;
      categories = Array.from({ length: timeUnits }, (_, i) =>
        now.clone().subtract(i, "months").format("MMM YYYY")
      ).reverse();
    } else if (viewMode === "yearly") {
      startDate = now.clone().subtract(11, "months").startOf("month");
      timeUnits = 12;
      categories = Array.from({ length: timeUnits }, (_, i) =>
        now.clone().subtract(i, "months").format("MMM YYYY")
      ).reverse();
    }

    let patientCounts = new Array(timeUnits).fill(0);

    for (let i = 0; i < timeUnits; i++) {
      let currentStart = moment(categories[i], "DD MMM").startOf("day").format("YYYY_MM_DD");
      let currentEnd = moment(categories[i], "DD MMM").endOf("day").format("YYYY_MM_DD");

      if (viewMode !== "daily" && viewMode !== "monthly") {
        currentStart = moment(categories[i], "MMM YYYY").startOf("month").format("YYYY_MM_DD");
        currentEnd = moment(categories[i], "MMM YYYY").endOf("month").format("YYYY_MM_DD");
      }

      // Query appointments where doctorId matches and the date falls in range
      const appointmentQuery = query(
        collection(db, "prescriptions")
      );
      const appointmentSnapshot = await getDocs(appointmentQuery);

      let patientCount = 0;

      appointmentSnapshot.forEach((doc) => {
        const appointmentDate = doc.data().createdAt;
        if (appointmentDate >= currentStart && appointmentDate <= currentEnd) {
            patientCount++;
        }
      });

      patientCounts[i] = patientCount;
    }

    if (viewMode === "daily") {
      console.log("Daily Patient Counts: ", patientCounts); // Log the patient counts array
    }else if (viewMode === "monthly") {
        console.log("Monthly Patient Counts: ", patientCounts);
    }else if (viewMode === "sixMonths") {
        console.log("Weekly Patient Counts: ", patientCounts);
    }

    return { data: patientCounts, categories };
  } catch (error) {
    console.error("Error fetching patient count:", error);
    return { data: [], categories: [] };
  }
};
