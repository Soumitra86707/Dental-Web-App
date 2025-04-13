import { db } from "../Config/FirebaseConfig"; // Firestore instance
import { collection, query, where, onSnapshot } from "firebase/firestore";
import moment from "moment"; // For handling date filtering

export const fetchPatientsData = (viewMode, setPatientsData) => {
  try {
    const today = moment().endOf("day"); // End of the current day for proper range comparison
    let startDate;
    let dateFormat;
    let labelFormat;

    // Determine startDate, data format, and label format
    if (viewMode === "weekly") {
      startDate = today.clone().subtract(6, "days").startOf("day"); // Past 7 days
      dateFormat = "YYYY-MM-DD"; // Group by exact date
      labelFormat = "dddd"; // Show day names (e.g., Monday, Tuesday)
    } else if (viewMode === "monthly") {
      startDate = today.clone().subtract(1, "months").startOf("month"); // Last 1 month
      dateFormat = "YYYY-MM-DD"; // Group by date
      labelFormat = "DD"; // Show day number (e.g., 01, 02, 03)
    } else if (viewMode === "sixMonths") {
      startDate = today.clone().subtract(5, "months").startOf("month"); // Last 6 months
      dateFormat = "YYYY-MM"; // Group by month
      labelFormat = "MMM"; // Show short month name (e.g., Jan, Feb, Mar)
    } else if (viewMode === "yearly") {
      startDate = today.clone().subtract(11, "months").startOf("month"); // Last 12 months
      dateFormat = "YYYY-MM"; // Group by month
      labelFormat = "MMM"; // Show short month name (e.g., Jan, Feb, Mar)
    } else {
      return { data: [], categories: [] }; // Invalid mode
    }

    // Query Firestore with a real-time listener
    const patientsData = {};
    const prescriptionQuery = collection(db, "Prescription");
    
    // Using onSnapshot to listen for changes in real-time
    const unsubscribe = onSnapshot(prescriptionQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const { createdAt } = doc.data();
        const date = moment(createdAt, "YYYY-MM-DD"); // Ensure correct date parsing

        // Check if the date is within the desired range
        if (date.isBetween(startDate, today, undefined, "[]")) {
          const key = date.format(dateFormat); // Store actual date
          const label = date.format(labelFormat); // Display formatted label

          patientsData[label] = (patientsData[label] || 0) + 1;
        }
      });

      // Sort and structure data
      const categories = Object.keys(patientsData).sort((a, b) => 
        moment(a, labelFormat).diff(moment(b, labelFormat))
      );
      const data = categories.map((label) => patientsData[label]);

      // Use the callback to update the state with new data
      setPatientsData({ data, categories });
    });

    // Return the unsubscribe function so you can stop listening later
    return unsubscribe;

  } catch (error) {
    console.error("Error fetching patient data:", error);
    setPatientsData({ data: [], categories: [] });
    return () => {}; // Return a no-op function in case of error
  }
};
