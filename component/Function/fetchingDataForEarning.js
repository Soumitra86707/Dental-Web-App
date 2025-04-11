import { collection, query, where, getDocs } from "firebase/firestore";
import moment from "moment";
import { db } from "../Config/FirebaseConfig"; // Adjust import as per your project structure

export const fetchEarningsData = async (doctorId, earningsViewMode) => {
  try {
   

    const now = moment();
    let startDate, monthsCount,timeUnits, categories = [];

    if (earningsViewMode === "sixMonths") {
      startDate = now.clone().subtract(5, "months").startOf("month");
      timeUnits = 6;
      categories = Array.from({ length: timeUnits }, (_, i) =>
        now.clone().subtract(i, "months").format("MMM YYYY")
      ).reverse();
    } else if (earningsViewMode === "yearly") {
      startDate = now.clone().subtract(11, "months").startOf("month");
      timeUnits = 12;
      categories = Array.from({ length: timeUnits }, (_, i) =>
        now.clone().subtract(i, "months").format("MMM YYYY")
      ).reverse();
    }


    let earnings = new Array(monthsCount).fill(0);

    for (let i = 0; i < timeUnits; i++) {
      let  currentStart = moment(categories[i], "MMM YYYY").startOf("month").format("YYYY_MM_DD");
      let  currentEnd = moment(categories[i], "MMM YYYY").endOf("month").format("YYYY_MM_DD");

      // Fetch credits and debits in a single loop
      const creditQuery = query(
        collection(db, "Earning"),
        where("paymentTo", "==", doctorId)
      );
      const debitQuery = query(
        collection(db, "Earning"),
        where("paymentBy", "==", doctorId)
      );

      const creditSnapshot = await getDocs(creditQuery);
      const debitSnapshot = await getDocs(debitQuery);

      let totalCredits = 0;
      let totalDebits = 0;

      // Process credit records
      creditSnapshot.forEach((doc) => {
        const createdAt = doc.data().createdAt; // Ensure proper date format
        if (createdAt >= currentStart && createdAt <= currentEnd) {
          totalCredits += Number(doc.data().PaidAmount) || 0;
        }
      });

      // Process debit records
      debitSnapshot.forEach((doc) => {
        const createdAt = doc.data().createdAt;
        if (createdAt >= currentStart && createdAt <= currentEnd) {
          totalDebits += Number(doc.data().PaidAmount) || 0;
        }
      });
        
      // Calculate net earnings
      earnings[i] = totalCredits - totalDebits;

      if (earningsViewMode  === "sixMonths") {
      
    }
    }

    return { data: earnings, categories };
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return { data: [], categories: [] };
  }
};
