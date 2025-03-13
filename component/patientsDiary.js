import { useEffect, useState } from "react";
import "../vendors/styles/core.css";
import "../vendors/styles/icon-font.min.css";
import "../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../vendors/styles/style.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "./loading.css";
import { db } from "./Config/FirebaseConfig"; // Ensure firebase is configured properly
import { collection, getDocs } from "firebase/firestore";
import { FaFileCsv, FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";

import React from "react";

import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

function App() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [filteredReports, setFilteredReports] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [quickFilter, setQuickFilter] = useState("1-day");
    
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchPrescriptions = async () => {
            const prescriptionsCollection = collection(db, "prescriptions");
            const prescriptionsSnapshot = await getDocs(prescriptionsCollection);
            const prescriptionsList = prescriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPrescriptions(prescriptionsList);
        };
        fetchPrescriptions();
    }, []);
    
    useEffect(() => {
        filterReports();
    }, [searchQuery, dateFilter, quickFilter, prescriptions]);
    
    const filterReports = () => {
        let filtered = prescriptions.filter(report =>

            report.phoneNumber?.toString().includes(searchQuery) ||
            report.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.reason_for_visit?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    
        if (dateFilter) {
            filtered = filtered.filter(report => 
                new Date(report.createdAt.replace(/_/g, "-")).toISOString().split("T")[0] === dateFilter
            );
            
        }
    
        if (quickFilter !== "All") {
            const now = new Date();
            filtered = filtered.filter((report) => {
                // Convert "YYYY_MM_DD" format to "YYYY-MM-DD" and then to Date object
                const uploadDate = new Date(report.createdAt.replace(/_/g, "-")); 
        
                if (isNaN(uploadDate)) return false; // Skip invalid dates
        
                const timeDiff = now - uploadDate;
        
                switch (quickFilter) {
                    case "1-day":
                        return timeDiff <= 24 * 60 * 60 * 1000;
                    case "1-week":
                        return timeDiff <= 7 * 24 * 60 * 60 * 1000;
                    case "15-days":
                        return timeDiff <= 15 * 24 * 60 * 60 * 1000;
                    case "1-month":
                        return timeDiff <= 30 * 24 * 60 * 60 * 1000;
                    case "6-months":
                        return timeDiff <= 180 * 24 * 60 * 60 * 1000;
                    case "1-year":
                        return timeDiff <= 365 * 24 * 60 * 60 * 1000;
                    default:
                        return true;
                }
            });
        }
        
        // Fix sorting: Use `createdAt` instead of `uploadDate`
        filtered.sort((a, b) => new Date(b.createdAt.replace(/_/g, "-")) - new Date(a.createdAt.replace(/_/g, "-")));
        
        setFilteredReports(filtered);
    };
    

  const exportToExcel = () => {
    // Add Serial Numbers
    const dataWithSerialNumbers = filteredReports.map((row, index) => ({
      "S.No": index + 1, // Serial number
      "Phone Number": row.phoneNumber,
      "Name": row.patientName,
      "Reason For Visit": row.reason_for_visit,
      "Assigned Consultant": row.doctor || "",
      "Appointment Date": row.appointment_date,
      "Follow Up Date": row.followUpDate,
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(dataWithSerialNumbers); // Use modified data
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Payment History");
    XLSX.writeFile(workbook, "Patients_History.xlsx");
  };



    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Patient History", 20, 10);
        doc.autoTable({
            head: [["Phone Number", "Name", "Reason For Visit", "Assigned Consultant", "Appointment Date", "Follow Up Date"]],
            body: filteredReports.map(row => [row.phoneNumber, row.patientName, row.reason_for_visit, row.doctor || "", row.appointment_date, row.followUpDate]),
        });
        doc.save("Patients_History.pdf");
    };
    

    
    const exportToWord = () => {
        let content = `\uFEFF
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'></head>
            <body>
                <h2>Patient History</h2>
                <table border='1' style='border-collapse: collapse;'>
                    <tr><th>Phone Number</th><th>Name</th><th>Reason For Visit</th><th>Assigned Consultant</th><th>Appointment Date</th><th>Follow Up Date</th></tr>
                    ${filteredReports.map(row => 
                        `<tr><td>${row.phoneNumber}</td><td>${row.patientName}</td><td>${row.reason_for_visit}</td><td>${row.doctor || ""}</td><td>${row.appointment_date}</td><td>${row.followUpDate}</td></tr>`
                    ).join('')}
                </table>
            </body>
            </html>`;
    
        const blob = new Blob([content], { type: "application/msword" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Patients_History.doc";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const viewPrescription = (prescriptionId) => () => {
        navigate(`/Prescription/Download/${prescriptionId}`);
    };
    
    const editPrescription = (prescriptionId) => () => {
        navigate(`/Prescription/edit/${prescriptionId}`);
    };
    
    return (
        <div className="App">
            <div className="main-container">
                <div className="xs-pd-20-10 pd-ltr-20">
                    <div className="card-box pb-10">
                    <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px",
                }}
              >
                <div style={{ textAlign: "left", fontSize: "25px", fontWeight: "bold" }}>Patients History</div>
                                        
                            </div>
                                    <div
                                style={{
                                display: "flex",
                                justifyContent: "flex-end", // Aligns content to the right
                                width: "100%",
                                padding: "10px",
                                }}
                            >
                            
                                <div className="filter-container">
                                    <input type="text" placeholder="Search" className="alloversearchbar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                                    style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none",}} />

                                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                                    style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1 }} />

                                    <select value={quickFilter} onChange={(e) => setQuickFilter(e.target.value)}
                                        style={{ padding: "5px 10px", border: "1px solid #ccc", borderRadius: "5px", backgroundColor: "#fff", color: "#333", cursor: "pointer", outline: "none" }}
                                        >
                                        
                                        <option value="1-day">1 Day</option>
                                        <option value="1-week">1 Week</option>
                                        <option value="15-days">15 Days</option>
                                        <option value="1-month">1 Month</option>
                                        <option value="6-months">6 Months</option>
                                        <option value="1-year">1 Year</option>
                                        <option value="All">All</option>
                                        
                                    </select>
                                </div>
                        </div>
                        <table className="data-table table nowrap  table-striped landingPage-Table">
                            <thead>
                                <tr>
                                    <th>Phone Number</th>
                                    <th>Name</th>
                                    <th>Reason</th>
                                    <th>Assigned Consultant</th>
                                    <th>Appointment Date</th>
                                    <th>Follow Date</th>
                                    
                                    <th>Action</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                                </tr>
                                ) : (
                            filteredReports.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.phoneNumber}</td>
                                        <td>{row.patientName}</td>
                                        <td>{row.reason_for_visit}</td>
                                        <td>{row.reason_for_visit1 || " ---"}</td>
                                        <td>{row.appointment_date || " --- "}</td>
                                        <td>{row.followUpDate ||"---"}</td>
                                        <td>    
                                            <div className="dropdown" style={{marginRight:"20px"}}>
                                            <button  className="btn btn-link font-24 p-0 line-height-1 no-arrow dropdown-toggle text-decoration-none"
                                                type="button" onClick={() => setOpenDropdown(openDropdown === index ? null : index)} >
                                                    <i className="dw dw-more"></i>
                                                </button>
                                                <ul className={`dropdown-menu dropdown-menu-end dropdown-menu-icon-list ${openDropdown === index ? "show" : ""}`} style={{marginRight:"1000px"}}>

                                                    <li>
                                                    <a className="dropdown-item" onClick={viewPrescription(row.prescriptionId)} >

                                                        <i className="dw dw-eye" ></i>view
                                                        
                                                    </a>
                                                    </li>
                                                    <li>
                                                    <a className="dropdown-item" onClick={editPrescription(row.prescriptionId)} >
                                                        <i className="dw dw-edit2"></i> Edit
                                                    </a>
                                                    </li>
                                                    
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                        
                        <div style={{ marginTop: "10px",bottom:"0",zIndex:"1001",position:"fixed", display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
                            <button className="btn btn-success btn btn-success" onClick={exportToExcel} style={{ margin: "5px" }}>
                                <FaFileExcel /> Download Excel
                            </button>
                            
                            <button className="btn btn-danger" onClick={exportToPDF} style={{ margin: "5px" }}>
                               <FaFilePdf /> Download PDF
                            </button>
                            <button className="btn btn-info" onClick={exportToWord} style={{ margin: "5px" }}>
                               <FaFileWord /> Download Word
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
