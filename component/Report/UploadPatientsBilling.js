import React, { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PatientForm = ({ id, setIsVisible }) => {
  const [patientName, setPatientName] = useState("");
  const [itemName, setItemName] = useState("");
  const [extraExpenses, setExtraExpenses] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentTo, setPaymentTo] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");

  useEffect(() => {
    if (id) {
      const fetchFormData = async () => {
        const q = query(
          collection(db, "PatientsBilling"),
          where("PaymentId", "==", id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setExtraExpenses(data.extraExpenses || "");
          setTotalAmount(data.totalAmount || "");
          setPaidAmount(data.paidAmount || "");
          setDueAmount(data.dueAmount || "");
          setIssueDate(data.issueDate || "");
          setPatientName(data.patientName || "");
          setItemName(data.itemName || "");
        } else {
          console.log("No matching documents found for the given ID.");
        }
      };

      fetchFormData();
    }
  }, [id]);

  const handleTotalAmountChange = (e) => {
    const value = e.target.value;
    setTotalAmount(value);
    const total = parseFloat(value);
    const paid = parseFloat(paidAmount);
    if (!isNaN(total) && !isNaN(paid)) {
      const due = total - paid;
      setDueAmount(due >= 0 ? due : 0);
    } else {
      setDueAmount("");
    }
  };
  
  const handlePaidAmountChange = (e) => {
    const value = e.target.value;
    setPaidAmount(value);
    const total = parseFloat(totalAmount);
    const paid = parseFloat(value);
    if (!isNaN(total) && !isNaN(paid)) {
      const due = total - paid;
      setDueAmount(due >= 0 ? due : 0);
    } else {
      setDueAmount("");
    }
  };
  

  const generateAppointmentId = (length = 20) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}_${month}_${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const PaymentId = id || generateAppointmentId();
    const formattedDate = formatDate(new Date());
    const currentMonth = formattedDate.split("_").slice(0, 2).join("_");

    const expenseQuery = query(
      collection(db, "PatientsBilling"),
      where("createdDate", ">=", `${currentMonth}_01`),
      where("createdDate", "<=", `${currentMonth}_31`)
    );

    const expenseSnapshot = await getDocs(expenseQuery);
    const billCount = expenseSnapshot.size;
    const billNumber = `Bill ${billCount + 1}`;

    const paymentData = {
      paymentTo,
      totalAmount,
      paidAmount,
      dueAmount,
      issueDate,
      createdDate: formattedDate,
      createdTime: new Date().toLocaleTimeString(),
      paymentDate: issueDate,
      patientId: id || "new",
      paymentName: patientName,
      patientName,
      itemName,
      PaymentId,
      billNumber,
    };

    if (id) {
      const q = query(
        collection(db, "PatientsBilling"),
        where("PaymentId", "==", id)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, paymentData);
      } else {
        console.log("No expense document found with this PaymentId.");
      }
    } else {
      const docRef = await addDoc(collection(db, "PatientsBilling"), paymentData);
      paymentData.PaymentId = docRef.id;
    }

    const earningData = {
      paymentType: "Patients Billing",
      paymentTo: paymentTo,
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
      const earningQuery = query(
        collection(db, "Earning"),
        where("invoiceId", "==", id)
      );
      const earningSnapshot = await getDocs(earningQuery);
      if (!earningSnapshot.empty) {
        const docRef = earningSnapshot.docs[0].ref;
        await updateDoc(docRef, earningData);
      } else {
        console.log("No earning document found with this PaymentId.");
      }
    } else {
      await addDoc(collection(db, "Earning"), earningData);
    }

    setIsVisible(false);
    toast.success("Payment Successfully! Redirecting...", {
      autoClose: 3000,
      className: "custom-toast",
      closeOnClick: false,
      draggable: false,
    });
  };

  return (
    <div className="card-box xs-pd-20-10 pd-ltr-20" style={{ marginBottom: "10px" }}>
      <form onSubmit={handleSubmit}>
        <h3>Patients Billing Form</h3>
        <div className="row">
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Patient Name</label>
              <input
                type="text"
                className="form-control"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                className="form-control"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Payment To</label>
              <input
                type="text"
                className="form-control"
                value={paymentTo}
                onChange={(e) => setPaymentTo(e.target.value)}
                required
              />
            </div>
          </div>
          
        </div>
        <div className="row">
        <div className="col-md-3 col-sm-12">
            <div className="form-group">
              <label>Total Amount</label>
              <input
                type="text"
                className="form-control"
                value={totalAmount}
                onChange={handleTotalAmountChange}
                required
              />
            </div>
          </div>
          <div className="col-md-3 col-sm-12">
            <div className="form-group">
              <label>Paid Amount</label>
              <input
                type="text"
                className="form-control"
                value={paidAmount}
                onChange={handlePaidAmountChange}
                required
              />
            </div>
          </div>
          <div className="col-md-3 col-sm-12">
            <div className="form-group">
              <label>Due Amount</label>
              <input
                type="text"
                className="form-control"
                value={dueAmount}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-3 col-sm-12">
            <div className="form-group">
              <label>Issue Date</label>
              <input
                type="date"
                className="form-control"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div
            className="col-md-10 text-center"
            style={{ marginBottom: "10px", display: "flex", gap: "20px" }}
          >
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsVisible(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
