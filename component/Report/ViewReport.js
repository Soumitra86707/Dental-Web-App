import { useEffect, useState } from "react";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import { db, storage } from "../Config/FirebaseConfig";
/* import "./ViewReports.css"; */
import { FaFileCsv, FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";
import React from "react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from "docx";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { FaDownload } from "react-icons/fa";
import PatientForm from "./UploadReports";


function ViewReport() {
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("1-day");
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  

  useEffect(() => {
    const fetchPatientsLabReports = async () => {
      try {
        const PatientsLabReportsCollection = collection(db, "Patients Lab Reports");
        const PatientsLabReportsQuery = query(PatientsLabReportsCollection, orderBy("uploadTime", "desc"));
        const PatientsLabReportsSnapshot = await getDocs(PatientsLabReportsQuery);
  
        const reportsArray = PatientsLabReportsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          imageUrl: "", // Placeholder, will be updated later
        }));
  
        setReportsData(reportsArray);
        setFilteredReports(reportsArray); // Initialize filtered data
  
        // Fetch URLs after 3-4 seconds
        setTimeout(async () => {
          const updatedReports = await Promise.all(
            reportsArray.map(async (report) => {
              if (report.fileName) {
                try {
                  const fileRef = ref(storage, `Patients Lab Reports/${report.fileName}`);
                  const imageUrl = await getDownloadURL(fileRef);
                  return { ...report, imageUrl };
                } catch (error) {
                  console.warn(`Failed to get image URL for ${report.fileName}: ${error.message}`);
                }
              }
              return report;
            })
          );
  
          setReportsData(updatedReports);
          setFilteredReports(updatedReports);
        }, 3000); // Delay of 3 seconds
  
      } catch (error) {
        console.error("Error fetching reports: ", error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPatientsLabReports();
  }, []);
  

  const filterReports = () => {

    let filtered = reportsData.filter(
      (report) =>
        report.phoneNumber?.toString().includes(searchQuery) ||
      report.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportDetails?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patientId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    
          
    if (dateFilter) {
      
  
      filtered = filtered.filter(report => {

  
          const examDate = new Date(report.examinationDate.replace(/_/g, "-")).toISOString().split("T")[0];
          const repDate = new Date(report.reportDate).toISOString().split("T")[0];
          const upDate = new Date(report.uploadDate).toISOString().split("T")[0];
  
          return examDate === dateFilter || repDate === dateFilter || upDate === dateFilter ;
      });
  }
  
  
      
  
    if (quickFilter !== "All") {
      const now = new Date();
      filtered = filtered.filter((report) => {
        const uploadDate = new Date(report.uploadDate.replace(/_/g, "-"));
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
    filtered.sort((a, b) => new Date(b.uploadDate.replace(/_/g, "-")) - new Date(a.uploadDate.replace(/_/g, "-")));
    setFilteredReports(filtered);
  };

  useEffect(() => {
    filterReports();
  }, [searchQuery, dateFilter, quickFilter, reportsData]);


  if (loading) {
    return <div>Loading...</div>;
  }

  const exportToExcel = () => {
    // Add Serial Numbers
    const dataWithSerialNumbers = filteredReports.map((row, index) => ({
      "S.No": index + 1, // Serial number
      "Patients Name": row.patientName,
      "Report Name": row.reportName,
      "Report Details": row.reportDetails,
      "Examine Date": row.examinationDate,
      "Examine Date": row.reportDate,
      "Upload Date": row.uploadDate,
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(dataWithSerialNumbers); // Use modified data
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Payment History");
    XLSX.writeFile(workbook, "Invoices_History.xlsx");
  };
  


  // Export full table as PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Invoices_History", 20, 10);
  
    doc.autoTable({
      head: [["S.No", "Patient Name", "Report Name", "Report Details", " Examine Date", "Report Date", "Upload Date"]], // Added "S.No"
      body: filteredReports.map((row, index) => [
        index + 1, // Serial number
        row.patientName,
        row.reportName,
        row.reportDetails,
        row.examinationDate,
        row.reportDate,
        row.uploadDate,
      ]),
    });
  
    doc.save("Invoices_history.pdf");
  };
  
  

  // Export full table as Word document
  const exportToWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph("Payment_History"),
            new Table({
              rows: [
                // Table Header with Serial Number
                new TableRow({
                  children: ["S.No", "Patient Name", "Report Name", "Report Details", " Examine Date"," Report Date", "Upload Date"].map(
                    (header) => new TableCell({ children: [new Paragraph(header)] })
                  ),
                }),
                // Table Data with Serial Number
                ...filteredReports.map((row, index) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(index + 1))] }), // Serial Number
                      new TableCell({ children: [new Paragraph(String(row.patientName))] }),
                      new TableCell({ children: [new Paragraph(String(row.reportName))] }),
                      new TableCell({ children: [new Paragraph(String(row.reportDetails))] }),
                      new TableCell({ children: [new Paragraph(String(row.examinationDate))] }),
                      new TableCell({ children: [new Paragraph(String(row.reportDate))] }),
                      new TableCell({ children: [new Paragraph(String(row.uploadDate))] }),
                    ],
                  })
                ),
              ],
            }),
          ],
        },
      ],
    });
  
  
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Reports_history.docx";
    a.click();
    URL.revokeObjectURL(url);
  };


  const handleDownload = async (PatientsLabReport) => {
    try {
        if (!PatientsLabReport || !PatientsLabReport.fileName) {
            alert("Invalid file data.");
            return;
        }

        const fileRef = ref(storage, `Patients Lab Reports/${PatientsLabReport.fileName}`);
        const downloadUrl = await getDownloadURL(fileRef);

        // Option 1: Download the file
       /*  const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = PatientsLabReport.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); */

        // Option 2: Open file in a new tab (Remove if not needed)
         window.open(downloadUrl, "_blank");

    } catch (error) {
        console.error("Error downloading file:", error.message);
        alert("Failed to download file. Error: " + error.message);
    }
};

const handleEdit = (id) => {
  setSelectedId(id); // Store the selected ID
  setIsVisible(true); // Show the form
};


  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
        {isVisible && <PatientForm id={selectedId} setIsVisible={setIsVisible} />}
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
                <div style={{ textAlign: "left", fontSize: "25px", fontWeight: "bold" }}>Reports History</div>
                <div className=" btn text-primary weight-500 hover:text-white " style={{ textAlign: "right", fontSize: "18px", fontWeight: "bold",cursor:"pointer"  }} onClick={() => setIsVisible(!isVisible)}><i className="ion-plus-round text-primary"></i>  Upload Reports</div>
                        
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end", // Aligns content to the right
                  width: "100%",
                  padding: "10px",
                }}
              >
{/*                 <div style={{ textAlign: "left", fontSize: "18px", fontWeight: "bold" }}><div className="d-flex justify-content-between mb-2">
                </div>
              </div> */}
              <div className="filter-container">
                <input type="text" placeholder="Search" className="alloversearchbar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}  style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", }} />
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
          
            <table className="data-table table nowrap table-striped ReportTable">
              <thead>
                <tr>
                  <th className="table-plus">Name</th>
                  <th>Report Name</th>
                  <th>Report Details</th>
                  <th>Report Date</th>
                  <th>Examine Date</th>
                  <th className="datatable-nosort">Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                  </tr>
                ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td className="table-plus">{report.patientName || ""}</td>
                    <td>{report.reportName || ""}</td>
                    <td>{report.reportDetails || ""}</td>
                    <td>{report.reportDate}</td>
                    <td>{report.examinationDate}</td>
                    <td>
                      <div className="table-actions">
                          <a  data-color="#265ed7" >
                          <i className="icon-copy dw dw-edit2" onClick={() => handleEdit(report.id)}></i>
                          </a>
                          <a  data-color="#e95959" onClick={() => handleDownload(report)}>
                            <i className="fa fa-download"></i>

                          </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
            <div 
                        style={{ 
                            marginTop: "15px", 
                            display: "flex", 
                            gap: "10px",
                            flexWrap: "wrap", 
                            justifyContent: "center" // Align buttons properly in mobile view
                        }}
                        >
                        {/* <CSVLink data={filteredReports} filename="Reports.csv" className="btn btn-primary">
                            <FaFileCsv /> Download CSV
                        </CSVLink> */}
                        <button className="btn btn-success" onClick={exportToExcel}>
                            <FaFileExcel /> Download Excel
                        </button>
                        <button className="btn btn-danger" onClick={exportToPDF}>
                            <FaFilePdf /> Download PDF
                        </button>
                        <button className="btn btn-info" onClick={exportToWord}>
                            <FaFileWord /> Download Word
                        </button>
                        </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewReport;
