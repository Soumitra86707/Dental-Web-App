import { db } from "../Config/FirebaseConfig"; // Firestore instance
import { collection, query, where, getDocs } from "firebase/firestore";

export const fetchTotalEarnings = async (doctorId) => {
  try {
    let totalReceived = 0;
    let totalPaid = 0;

    // Fetch all earnings where doctor received money
    const receivedQuery = query(
      collection(db, "Earning"),
      where("paymentTo", "==", doctorId)
    );
    const receivedSnapshot = await getDocs(receivedQuery);
    receivedSnapshot.forEach((doc) => {
      totalReceived += Number(doc.data().PaidAmount);
    });

    // Fetch all earnings where doctor paid money
    const paidQuery = query(
      collection(db, "Earning"),
      where("paymentBy", "==", doctorId)
    );
    const paidSnapshot = await getDocs(paidQuery);
    paidSnapshot.forEach((doc) => {
      totalPaid += Number(doc.data().PaidAmount);
    });

    // Return Net Earnings
    return totalReceived - totalPaid;
  } catch (error) {
    console.error("Error fetching total earnings:", error);
    return 0; // Return 0 in case of an error
  }
};
