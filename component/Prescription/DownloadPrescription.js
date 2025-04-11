


    


import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../Config/FirebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DownloadPrescription = () => {
    const { prescriptionId } = useParams();
    const printRef = useRef(null);
    const [formData, setFormData] = useState(null);
    const [doctorData, setDoctorData] = useState(null);  // State to store doctor profile data
    const navigate = useNavigate();

    // Function to get the formatted date and time
    const getFormattedDateTime = () => {
        const now = new Date();
        const options = {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        };
        return now.toLocaleString("en-GB", options).replace(",", "");
    };

    const recentTime = getFormattedDateTime(); // Move it outside of useEffect

    // Fetch data from Firestore
    useEffect(() => {
        const fetchPrescription = async () => {
            try {
                const prescriptionRef = doc(db, "prescriptions", prescriptionId);
                const prescriptionSnap = await getDoc(prescriptionRef);

                if (prescriptionSnap.exists()) {
                    setFormData(prescriptionSnap.data());
                } else {
                    console.error("No such prescription found!");
                }
            } catch (error) {
                console.error("Error fetching prescription:", error);
            }
        };

        const fetchDoctorProfile = async () => {
            try {
                const q = query(collection(db, "profile"), where("id", "==", "1234"));  // Use the actual ID for fetching the profile
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach((doc) => {
                    setDoctorData(doc.data());  // Set the doctor profile data to the state
                });
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchPrescription();
        fetchDoctorProfile();
    }, [prescriptionId]);

    console.log(formData);
    const formatDate1 = (dateString) => {
        if (!dateString) return "N/A"; // Handle missing values
        const [year, month, day] = dateString.split("-");
        return `${day}-${month}-${year}`;
    };

    const editPrescription = (prescriptionId) => () => {
        navigate(`/Prescription/edit/${prescriptionId}`);
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) {
            console.error("printRef is null, cannot generate PDF!");
            return;
        }

        const element = printRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
        pdf.save("Prescription.pdf");
    };

    if (!formData || !doctorData) {
        return <p>Loading prescription...</p>;
    }
    const formatDate = (dateString) => {
        if (!dateString) return "N/A"; // Handle missing values
        const [year, month, day] = dateString.split("_");
        return `${day}-${month}-${year}`;
    };

    return (
        <div className="App">
            <div className="main-container">
                <div className="xs-pd-20-10 pd-ltr-20">
                    {/* The div to be converted to PDF */}
                    <div ref={printRef} style={{ padding: "20px", fontFamily: "Arial, sans-serif", margin: "0 100px 0 0" }}>
                        <h2>{doctorData.clinicName || "Dr. Nithya's Dental and Smile Design Clinic"}</h2>
                        <div className="Clinic-LetterHead" style={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="clinic-LetterHead-Left">
                                <strong>{doctorData.fullName || "Dr. Nithya Selvaraj, MDS"} <br /></strong>
                                <p>{doctorData.specialization || "Prosthodontist & Implantologist"} <br />
                                    {doctorData.registrationNumber || "Reg. No: 49867-A"}
                                </p>
                            </div>
                            <div className="clinic-LetterHead-Right">
                                <div className="ConsultantingTime" style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div className="Name">Consulting Time:</div>
                                    <div className="Time">10:30 AM - 1:00 PM <br />
                                        5:00 PM - 7:00 PM</div>
                                </div>
                                <div className="ClinicAddress">
                                    
                                    <div className="phonenumber">Mobile No. {doctorData.phone || "1234567890"}</div>
                                    <div className="address">Address: {doctorData.address || "xyz, abc, 457210"}</div>
                                </div>
                            </div>
                        </div>
                        <hr />
                        <div className="PrescriptionPatientsDetails" style={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="prescriptionPatientsDetails1st">
                                <h3>Name: {formData.patientSalutation} {formData.patientName}</h3>
                                <p>Age: {formData.age}</p>
                            </div>
                            <div className="prescriptionPatientsDetails2nd">
                                <p>Date & Time: {recentTime}</p>
                                <p>Mobile No. {formData.phoneNumber}</p>
                            </div>
                        </div>
                        {/* <h4 style={{ textDecoration: "underline" }}>Medicinal Diagnosis</h4> */}
                        <p><strong>Reason For Visit:</strong> {formData.reason_for_visit}</p>
                        <p><strong>On Examination:</strong> {formData.onExamination}</p>
                        <p><strong>Proposed Treatment Plan:</strong> {formData.proposedTreatmentPlan}</p>

                        {/* <h4 style={{ textDecoration: "underline" }}>Medicine:</h4> */}
                        <table style={{ width: "100%", background: "none", borderCollapse: "collapse", marginTop: "10px" }} className="data-table table nowrap table-striped">
                            <thead>
                                <tr style={{ textAlign: "left" }}>
                                    <th style={{ padding: "8px" }}>#</th>
                                    <th style={{ padding: "8px" }}>Medicine Name</th>
                                    <th style={{ padding: "8px" }}>Dosage</th>
                                    <th style={{ padding: "8px" }}>Days</th>
                                    <th style={{ padding: "8px" }}>Timing</th>
                                    <th style={{ padding: "8px" }}>Food Timing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.medicine?.map((medicine, index) => (
                                    <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                                        <td style={{ padding: "8px" }}>{index + 1}</td>
                                        <td style={{ padding: "8px" }}>{medicine.name || medicine.specificName || "N/A"}</td>
                                        <td style={{ padding: "8px" }}>
                                            {medicine.type === "syrup" ? `${medicine.dosage} ml` :
                                            medicine.type === "tablet" ? `${medicine.dosage} mg` :
                                            medicine.dosage || "N/A"}
                                        </td>
                                        <td style={{ padding: "8px" }}>{medicine.days || "N/A"}</td>
                                        <td style={{ padding: "8px" }}>{medicine.times ? medicine.times.join(", ") : "N/A"}</td>
                                        <td style={{ padding: "8px" }}>{medicine.food ? (medicine.food === "before" ? "Before Food" : "After Food") : "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* <h4 style={{ textDecoration: "underline" }}>Treatment Details</h4> */}
                        <p><strong>Radiography Report:</strong> {formData.radiographReports}</p>

                        {/* <h4 style={{ textDecoration: "underline", marginBottom: "10px" }}>Payment & Follow-up</h4> */}
                        <p><strong>Payment Amount:</strong> {formData.paymentDetails}</p>
                        <p><strong>Follow-up Date:</strong> {formatDate1(formData.followUpDate)}</p>

                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px" }}>
                            <div>
                                <p>Date: {formatDate(formData.appointment_date)}</p>
                            </div>
                            <div>
                                <span>____________________</span>
                                <div className="SignatureName">{doctorData.fullName || "Dr. Nithya Selvaraj, MDS"}</div>
                                <div className="SignatureName1">Prosthodontist & Implantologist</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "20px", justifyContent: "center", alignItems: "center" }}>
                        <button 
                            type="button" 
                            onClick={editPrescription(prescriptionId)}
                            style={{ marginBottom: "20px", padding: "10px 20px", fontSize: "16px", backgroundColor:"#0D6EFD", borderRadius: "15px"}}
                        >
                            Edit Prescription
                        </button>
                        <button 
                            type="button" 
                            onClick={handleDownloadPDF} 
                            style={{ marginBottom: "20px", padding: "10px 20px", fontSize: "16px", backgroundColor:"#0D6EFD", borderRadius: "15px"}}
                        >
                            Download PDF
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DownloadPrescription;

