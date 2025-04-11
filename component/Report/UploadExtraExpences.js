import React, { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig"; // Firebase config
import { collection, query, where, addDoc, doc, updateDoc, getDoc, getDocs } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const PatientForm = ({ id, setIsVisible }) => {
  const [consultants, setConsultants] = useState([]);
  const [extraExpenses, setExtraExpenses] = useState("");
  
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [formData, setFormData] = useState(null);
  const navigate = useNavigate();

console.log("id asche na :",id);

  useEffect(() => {
    if (id) {
      console.log("id asche na 1:",id);
      const fetchFormData = async () => {
        const q = query(
          collection(db, "ExtraExpenses"),
          where("PaymentId", "==", id) // Look for PaymentId based on the passed `id`
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data(); // Get the first document
          setExtraExpenses(data.extraExpenses);
          setTotalAmount(data.totalAmount);
          setPaidAmount(data.paidAmount);
          setDueAmount(data.dueAmount);
          setIssueDate(data.issueDate);
          setFormData(data); // Store the fetched data in formData
        } else {
          console.log("No matching documents foundby that passed id.");
        }
      };

      fetchFormData();
    }
  }, [id]);

  const handleTotalAmountChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value)) {
      setTotalAmount(value);
      setDueAmount(value - paidAmount);
    }
  };

  const handlePaidAmountChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value)) {
      setPaidAmount(value);
      setDueAmount(totalAmount - value);
    }
  };

  const generateAppointmentId = (length = 20) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 because months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits for day
  
    return `${year}_${month}_${day}`;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const PaymentId = id || generateAppointmentId(); // Use provided ID or generate new one
    const formattedDate = formatDate(new Date()); // YYYY_MM_DD
    const currentMonth = formattedDate.split("_").slice(0, 2).join("_"); // YYYY_MM
  
    // Step 1: Get the count of existing expenses for the same extraExpense type
    const expenseQuery = query(
        collection(db, "ExtraExpenses"),
        where("extraExpenses", "==", extraExpenses), // First filter by extraExpenses
        where("createdDate", ">=", `${currentMonth}_01`),
        where("createdDate", "<=", `${currentMonth}_31`)
      );
  
    const expenseSnapshot = await getDocs(expenseQuery);
    const billCount = expenseSnapshot.size; // Get the number of existing bills of this type
    const billNumber = `Bill ${billCount + 1}`; // Generate new bill number
  
    // Step 2: Prepare payment data with the generated bill number
    const paymentData = {
      extraExpenses,
      totalAmount,
      paidAmount,
      dueAmount,
      issueDate,
      createdDate: formattedDate,
      createdTime: new Date().toLocaleTimeString(),
      paymentDate: issueDate,
      patientId: id || "new",
      paymentName: "",
      PaymentId,
      billNumber, // Store the generated bill number
    };
  
    // Step 3: Update or add expense record in Firestore
    if (id) {
      const q = query(collection(db, "ExtraExpenses"), where("PaymentId", "==", id));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, paymentData);
        console.log("Expense document updated successfully!");
      } else {
        console.log("No expense document found with this PaymentId.");
      }
    } else {
      const docRef = await addDoc(collection(db, "ExtraExpenses"), paymentData);
      paymentData.PaymentId = docRef.id; // Save generated doc ID as PaymentId
      console.log("New expense document created with ID:", docRef.id);
    }
  
    // Step 4: Handle Earning Data
    const earningData = {
      paymentType: extraExpenses,
      paymentTo: extraExpenses,
      paymentBy: "Dr. Nithya",
      TotalAmount: totalAmount,
      PaidAmount: paidAmount,
      dueAmount: dueAmount,
      createdAt: formattedDate,
      createdTime: new Date().toLocaleTimeString(),
      paymentDate: issueDate,
      patient_id: id || "new",
      phoneNumber: "",
      invoiceId: PaymentId,
    };
  
    if (id) {
      const earningQuery = query(collection(db, "Earning"), where("invoiceId", "==", id));
      const earningSnapshot = await getDocs(earningQuery);
  
      if (!earningSnapshot.empty) {
        const docRef = earningSnapshot.docs[0].ref;
        await updateDoc(docRef, earningData);
        console.log("Earning document updated successfully!");
      } else {
        console.log("No earning document found with this PaymentId.");
      }
    } else {
      const docRef = await addDoc(collection(db, "Earning"), earningData);
      earningData.PaymentId = docRef.id;
      console.log("New earning document created with ID:", docRef.id);
    }
  
    // Step 5: Close the form and show success message
    setIsVisible(false);
    toast.success("Payment Successfully! Redirecting...", {
      autoClose: 3000,
      className: "custom-toast",
      closeOnClick: false,
      draggable: false,
      progress: undefined,
    });
  
    // Refresh the page after 2 seconds
    setTimeout(() => {
      navigate(0);
    }, 2000);
  };
      

  return (
    <div className="card-box xs-pd-20-10 pd-ltr-20" style={{ marginBottom: "10px" }}>
      <form onSubmit={handleSubmit}>
        <h3>Extra Expenses Payment Form</h3>
        <div className="row">
        <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Extra Expenses</label>
              <select className="form-control" value={extraExpenses} onChange={(e) => setExtraExpenses(e.target.value)} required>
                <option value="">Select Expense Type</option>
                <option value="water_bill">Water Bill</option>
                <option value="electric_bill">Electric Bill</option>
                <option value="personal_bill">Personal Bill</option>
              </select>
            </div>
          </div>
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Total Amount</label>
              <input type="text" className="form-control" value={totalAmount} onChange={handleTotalAmountChange} required/>
            </div>
          </div>
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Paid Amount</label>
              <input type="text" className="form-control" value={paidAmount} onChange={handlePaidAmountChange} required/>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Due Amount</label>
              <input type="text" className="form-control" value={dueAmount} readOnly />
            </div>
          </div>
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Issue Date</label>
              <input type="date" className="form-control" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-10 text-center" style={{ marginBottom: "10px", display: "flex", gap: "20px" }}>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setIsVisible(false)}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
