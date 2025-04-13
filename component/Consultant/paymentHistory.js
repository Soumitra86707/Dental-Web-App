import { useEffect, useState } from "react";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";

import "bootstrap/dist/css/bootstrap.min.css";
import { db} from "../Config/FirebaseConfig";
/* import "./ViewReports.css"; */
import { FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";
import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from "docx";
import { collection, query, orderBy,  onSnapshot } from "firebase/firestore";
import PatientForm from "./ConsultantPayment";

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function ViewReport() {
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("1-day");
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const PatientsLabReportsCollection = collection(db, "consultantPayment");
    const PatientsLabReportsQuery = query(PatientsLabReportsCollection, orderBy("createdTime", "desc"));
  
    const unsubscribe = onSnapshot(PatientsLabReportsQuery, (snapshot) => {
      const reportsArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setReportsData(reportsArray);
      setFilteredReports(reportsArray); // update filtered data
      setLoading(false);
    });
  
    // ✅ This is the proper way to clean up onSnapshot listener
    return () => unsubscribe();
  }, []);
  

  const filterReports = () => {

    let filtered = reportsData.filter(
      (report) =>
        report.consultantPhoneNumber?.toString().includes(searchQuery) ||
      report.consultantName?.toLowerCase().includes(searchQuery.toLowerCase()) 
    );

    
          
    if (dateFilter) {
      
      filtered = filtered.filter(report => {

  
          
          const repDate = new Date(report.paymentDate).toISOString().split("T")[0];
          const upDate = new Date(report.createdDate).toISOString().split("T")[0];
  
          return  repDate === dateFilter || upDate === dateFilter ;
      });
  }
  
  
      
  
    if (quickFilter !== "All") {
      const now = new Date();
      filtered = filtered.filter((report) => {
        const uploadDate = new Date(report.createdDate.replace(/_/g, "-"));
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
    filtered.sort((a, b) => new Date(b.createdDate.replace(/_/g, "-")) - new Date(a.createdDate.replace(/_/g, "-")));
    setFilteredReports(filtered);
  };

  useEffect(() => {
    filterReports();
  }, [searchQuery, dateFilter, quickFilter, reportsData]);


  if (loading) {
    return <div>Loading...</div>;
  }
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const exportToExcel = () => {
    // Add Serial Numbers
    const dataWithSerialNumbers = filteredReports.map((row, index) => ({
      "S.No": index + 1, // Serial number
      "Consultant Name": row.consultantName,
      "Total Amount": row.totalAmount,
      "Paid Amount": row.paidAmount,
      "Due Amount": row.dueAmount,
      "Issue Date": row.issueDate,
      "Upload Date": row.createdDate,
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(dataWithSerialNumbers); // Use modified data
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Payment History");
    XLSX.writeFile(workbook, "Consultant_Payment_History.xlsx");
  };
  


  // Export full table as PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Consultant_Payment_History", 20, 10);
  
    doc.autoTable({
      head: [["S.No", "Consultant Name", "Total Amount", "Paid Amount", "Due Amount", "Issue Date", "Upload Date"]], // Added "S.No"
      body: filteredReports.map((row, index) => [
        index + 1, // Serial number
        row.consultantName,
        row.totalAmount,
        row.paidAmount,
        row.dueAmount,
        row.issueDate,
        row.createdDate,
      ]),
    });
  
    doc.save("Consultant_Payment_History.pdf");
  };
  
  

  // Export full table as Word document
  const exportToWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph("Consultant_Payment_History"),
            new Table({
              rows: [
                // Table Header with Serial Number
                new TableRow({
                  children: ["S.No", "Consultant Name", "Total Amount", "Paid Amount", "Due Amount","Issue Date", "Upload Date"].map(
                    (header) => new TableCell({ children: [new Paragraph(header)] })
                  ),
                }),
                // Table Data with Serial Number
                ...filteredReports.map((row, index) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(index + 1))] }), // Serial Number
                      new TableCell({ children: [new Paragraph(String(row.consultantName))] }),
                      new TableCell({ children: [new Paragraph(String(row.totalAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.paidAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.dueAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.issueDate))] }),
                      new TableCell({ children: [new Paragraph(String(row.createdDate))] }),
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
    a.download = "Consultant_Payment_history.docx";
    a.click();
    URL.revokeObjectURL(url);
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
                <div style={{ textAlign: "left", fontSize: "25px", fontWeight: "bold" }}>Consultant Payment History</div>
                <div className=" btn text-primary weight-500 hover:text-white " style={{ textAlign: "right", fontSize: "18px", fontWeight: "bold",cursor:"pointer"  }} onClick={() => setIsVisible(!isVisible)}><i className="ion-plus-round text-primary"></i>   Consultant Payment Form</div>
                        
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
          
            <table className="data-table table nowrap table-striped InvoicesTable">
                <thead>
                  <tr>
                    
                    <th className="table-plus">Consultant Name</th>
                    <th>Total Amount</th>
                    <th>Amount Paid</th>
                    <th>Due Amount</th>
                    <th>Issue Date</th>
                    
                    <th className="datatable-nosort">Actions</th>
                  </tr>
                </thead>
                <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                  </tr>
                ) : (
                  currentItems.map((report) => (
                    <tr key={report.id}>
                      <td className="table-plus">{report.consultantName}</td>
                      <td>{report.totalAmount}</td>
                      <td>{report.paidAmount}</td>
                      <td>{report.dueAmount}</td>
                      <td>{report.issueDate}</td>
                      <td>
                        <div className="table-actions" style={{display:"flex" , gap:"20px"}}>
                            <div  data-color="#265ed7"   onClick={(e) => {
                                e.preventDefault(); // Prevent page jump
                                handleEdit(report.PaymentId);
                              }}>
                              <i className="icon-copy dw dw-edit2" ></i>
                            </div>
                            
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
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
            <div 
                        style={{ 
                            marginTop: "15px", 
                            display: "flex", 
                            gap: "10px",
                            flexWrap: "wrap", 
                            justifyContent: "center" 
                        }}
                        >

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
