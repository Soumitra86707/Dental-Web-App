import React, { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig"; // Firebase config
import { collection, query, where, addDoc, doc, updateDoc, getDoc, getDocs } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const PatientForm = ({ id, setIsVisible }) => {
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [formData, setFormData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConsultants = async () => {
      const querySnapshot = await getDocs(collection(db, "consultants"));
      const consultantsList = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setConsultants(consultantsList);
    };

    fetchConsultants();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchFormData = async () => {
        const q = query(
          collection(db, "consultantPayment"),
          where("PaymentId", "==", id) // Look for PaymentId based on the passed `id`
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data(); // Get the first document
          setSelectedConsultant(data.consultantName);
          setTotalAmount(data.totalAmount);
          setPaidAmount(data.paidAmount);
          setDueAmount(data.dueAmount);
          setIssueDate(data.issueDate);
          setFormData(data); // Store the fetched data in formData
        } else {
          console.log("No matching documents found.");
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
  
    const PaymentId = id || generateAppointmentId();  // Use provided ID or generate new one
    const formattedDate = formatDate(new Date());
    const paymentData = {
      consultantName: selectedConsultant,
      totalAmount,
      paidAmount,
      dueAmount,
      issueDate,
      createdDate: formattedDate,
      createdTime: new Date().toLocaleTimeString(),
      paymentDate: issueDate,
      patientId: id || "new",
      paymentName: selectedConsultant,
      PaymentId,
    };
  
    // If `id` is provided (which means you're updating), find the document by PaymentId
    if (id) {
      // Query the `consultantPayment` collection where PaymentId matches
      const q = query(collection(db, "consultantPayment"), where("PaymentId", "==", id));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;  // Get the document reference from the query result
        // Now that we have the document reference, update it
        await updateDoc(docRef, paymentData);
        console.log("Document updated successfully!");
      } else {
        console.log("No document found with this PaymentId.");
      }
    } else {
      // If no `id`, create a new document
      const docRef = await addDoc(collection(db, "consultantPayment"), paymentData);
      paymentData.PaymentId = docRef.id;  // Save the generated doc ID as PaymentId
      console.log("New document created with ID:", docRef.id);
    }
  
    // Handle earning data as well
    const earningData = {
      paymentTo: selectedConsultant,
      paymentBy: "Dr. Nithya",
      TotalAmount: totalAmount,
      PaidAmount: paidAmount,
      dueAmount: dueAmount,
      createdAt : formattedDate,
      createdTime: new Date().toLocaleTimeString(),
      paymentDate: issueDate,
      patient_id: id || "new",
      phoneNumber: selectedConsultant,
      invoiceId :PaymentId,
    };
    if (id) {
      // Query the `consultantPayment` collection where PaymentId matches
      const q = query(collection(db, "Earning"), where("invoiceId", "==", id));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;  // Get the document reference from the query result
        // Now that we have the document reference, update it
        await updateDoc(docRef, earningData);
        console.log("Earning Document updated successfully!");
      } else {
        console.log("No document found with this PaymentId.");
      }
    } else {
      // If no `id`, create a new document
      const docRef = await addDoc(collection(db, "Earning"),  earningData);
      earningData.PaymentId = docRef.id;  // Save the generated doc ID as PaymentId
      console.log("New document created with ID:", docRef.id);
    }

  
     setIsVisible(false); // Close the form
     toast.success("Payment Successfully ! Redirecting...", {
              autoClose: 3000, // 10 seconds
              className: "custom-toast",
              closeOnClick: false,
              draggable: false,
              progress: undefined,
            });
        
            // Redirect to dashboard after 10 seconds
            setTimeout(() => {
              navigate(0);
            }, 2000);
  };
  

  return (
    <div className="card-box xs-pd-20-10 pd-ltr-20" style={{ marginBottom: "10px" }}>
      <form onSubmit={handleSubmit}>
        <h3>Consultant Payment Form</h3>
        <div className="row">
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Consultant Payment</label>
              <select className="form-control" value={selectedConsultant} onChange={(e) => setSelectedConsultant(e.target.value)}>
                <option value="">Select Consultant</option>
                {consultants.map((consultant) => (
                  <option key={consultant.id} value={consultant.name}>{consultant.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Total Amount</label>
              <input type="text" className="form-control" value={totalAmount} onChange={handleTotalAmountChange} />
            </div>
          </div>
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Paid Amount</label>
              <input type="text" className="form-control" value={paidAmount} onChange={handlePaidAmountChange} />
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
