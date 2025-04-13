import { useEffect, useState } from "react";
import "../vendors/styles/core.css";
import "../vendors/styles/icon-font.min.css";
import "../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../vendors/styles/style.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "./loading.css";
import "./Pagination.css";
import { db } from "./Config/FirebaseConfig"; // Ensure firebase is configured properly
import { collection, getDocs ,limit ,query } from "firebase/firestore";
import {  FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import React from "react";

import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

function App() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [filteredReports, setFilteredReports] = useState([]);
    const [monthFilter, setMonthFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [quickFilter, setQuickFilter] = useState("1-day");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                // Quick fetch of first 20 items
                const prescriptionsCollection = collection(db, "prescriptions");
                const first20Query = query(prescriptionsCollection, limit(20));
                const first20Snapshot = await getDocs(first20Query);
    
                const first20List = first20Snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
    
                // Set initial 20 results immediately
                setPrescriptions(first20List);
    
                // Delay fetching the rest
                setTimeout(async () => {
                    const fullSnapshot = await getDocs(prescriptionsCollection);
                    const fullList = fullSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
    
                    // Merge initial 20 with the rest
                    setPrescriptions(fullList);
                }, 3000); // 3-second delay (Adjust as needed)
    
            } catch (error) {
                console.error("Error fetching prescriptions: ", error.message);
            }
        };
        fetchPrescriptions();
    }, []);
    
    
    useEffect(() => {
        filterReports();
    }, [searchQuery, dateFilter, monthFilter, prescriptions]);
    
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
        if (monthFilter) {
            filtered = filtered.filter(report => {
                // Ensure createdAt is a valid date and extract YYYY-MM format
                const createdMonth = (() => {
                    if (!report.createdAt) return null; // Handle null or undefined values
        
                    const parsedDate = new Date(report.createdAt.replace(/_/g, "-"));
                    return isNaN(parsedDate) ? null : parsedDate.toISOString().slice(0, 7); // Extract YYYY-MM
                })();
        
                // Compare extracted YYYY-MM with monthFilter
                return createdMonth === monthFilter;
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
    

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

    // Get current page data
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
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

                                    <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
                                    style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1 }} />

                                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                                    style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1 }} />
                            </div>
                        </div>
                        <table className="data-table table nowrap table-striped landingPage-Table">
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
                    {currentItems.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                        </tr>
                    ) : (
                        currentItems.map((row, index) => (
                            <tr key={index}>
                                <td>{row.phoneNumber}</td>
                                <td>{row.patientName}</td>
                                <td>{row.reason_for_visit}</td>
                                <td> {Array.isArray(row.consultants) ? [...new Set(row.consultants.map(c => c.name))].join(" , ") : " ---"}</td>

                                <td>{row.appointment_date || " --- "}</td>
                                <td>{row.followUpDate || "---"}</td>
                                <td>
                                    <div className="dropdown" style={{ marginRight: "20px" }}>
                                        <button
                                            className="btn btn-link font-24 p-0 line-height-1 no-arrow dropdown-toggle text-decoration-none"
                                            type="button"
                                            onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                                        >
                                            <i className="dw dw-more"></i>
                                        </button>
                                        <ul
                                            className={`dropdown-menu dropdown-menu-end dropdown-menu-icon-list ${openDropdown === index ? "show" : ""}`}
                                            style={{ marginRight: "1000px" }}
                                        >
                                            <li style={{ cursor: "pointer" }}>
                                                <a
                                                    className="dropdown-item"
                                                    onClick={() => navigate(`/Prescription/Download/${row.prescriptionId}`)}
                                                >
                                                    <i className="dw dw-eye"></i> View
                                                </a>
                                            </li>
                                            <li style={{ cursor: "pointer" }}>
                                                <a
                                                    className="dropdown-item"
                                                    onClick={() => navigate(`/Prescription/edit/${row.prescriptionId}`)}
                                                >
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

            {/* Pagination Controls */}
            <div className="pagination-controls">
                <button 
                    disabled={currentPage === 1} 
                    onClick={() => paginate(currentPage - 1)}
                >
                    <FaChevronLeft />
                </button>
                <span>{currentPage} / {totalPages}</span>
                <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => paginate(currentPage + 1)}
                >
                    <FaChevronRight />
                </button>
            </div>
                        <div style={{ marginTop: "10px", display: "flex",gap:"15px", flexWrap: "wrap", justifyContent: "center" }}>
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
