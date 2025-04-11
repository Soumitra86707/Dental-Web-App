import { useEffect, useState } from "react";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import { db, storage } from "../Config/FirebaseConfig";
import "./ViewReports.css";
import { FaFileCsv, FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";
import React from "react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from "docx";
import { collection, query,where,orderBy, getDocs , getDoc,doc,updateDoc,addDoc } from "firebase/firestore";
import {ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { FaDownload } from "react-icons/fa";
import "./ViewReports.css";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';


function ViewReport() {
  const [filteredReports, setFilteredReports] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("1 week");
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [patientOptions, setPatientOptions] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState("");
    const [customPatientName, setCustomPatientName] = useState("");
    const [selectedLab, setSelectedLab] = useState("");
    const [customLabName, setCustomLabName] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [paidAmount, setPaidAmount] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [invoiceFile, setInvoiceFile] = useState(null);
      const [filePreview, setFilePreview] = useState(null);
      const [isOpen, setIsOpen] = useState(false);
      const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
      const [rowsPerPage, setRowsPerPage] = useState(10);
      /* const [currentPage, setCurrentPage] = useState(1); */
      const [invoiceId, setInvoiceId] = useState(null); // Store selected invoice ID
      const [file, setFile] = useState(null);
      const [preview, setPreview] = useState(null);
      const [isEditing, setIsEditing] = useState(false);
      const { id } = useParams();
      const navigate = useNavigate();
      useEffect(() => {
        const fetchPatientsLabReports = async () => {
          try {
            const PatientsLabReportsCollection = collection(db, "invoices");
            const PatientsLabReportsQuery = query(PatientsLabReportsCollection, orderBy("uploadTime", "desc"));
            const PatientsLabReportsSnapshot = await getDocs(PatientsLabReportsQuery);
      
            // Extract data without fetching URLs
            const reportsArray = PatientsLabReportsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              imageUrl: "", // Placeholder for image URLs
            }));
      
            setReportsData(reportsArray);
            setFilteredReports(reportsArray); // Initialize filtered data
      
            // Delay fetching image URLs by 3-4 seconds
            setTimeout(() => fetchImageUrls(reportsArray), 3000);
            
          } catch (error) {
            console.error("Error fetching reports: ", error.message);
          } finally {
            setLoading(false);
          }
        };
      
        const fetchImageUrls = async (reports) => {
          const updatedReports = await Promise.all(
            reports.map(async (report) => {
              if (report.fileName) {
                try {
                  const fileRef = ref(storage, `invoices/${report.fileName}`);
                  const imageUrl = await getDownloadURL(fileRef);
                  return { ...report, imageUrl };
                } catch (error) {
                  console.warn(`Failed to get image URL for ${report.fileName}: ${error.message}`);
                }
              }
              return report; // Return report without image URL if fetch fails
            })
          );
      
          setReportsData(updatedReports);
          setFilteredReports(updatedReports);
        };
      
        fetchPatientsLabReports();
      }, []);
      







      const [currentPage, setCurrentPage] = useState(1);
      const itemsPerPage = 5;
  
      // Calculate total pages
      const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  
      // Get current page data
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  
      // Change page
      const paginate = (pageNumber) => setCurrentPage(pageNumber);
  








  const filterReports = () => {
    let filtered = reportsData.filter(
      (report) =>
        report.laboratoryName?.toLowerCase().includes(searchQuery.toLowerCase()) 
    );
    if (dateFilter) {
      console.log("vdbfvbdhf :", dateFilter);
      filtered = filtered.filter(report => 
        new Date(report.uploadDate.replace(/_/g, "-")).toISOString().split("T")[0] === dateFilter
    );
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
  
    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.uploadDate.replace(/_/g, "-")) - new Date(a.uploadDate.replace(/_/g, "-")));
    setFilteredReports(filtered);
  };

  useEffect(() => {
    filterReports();
  }, [searchQuery, dateFilter, quickFilter, reportsData]);

  // Update filtered data when searchQuery or dateFilter changes
/*    useEffect(() => {
    let filtered = reportsData.filter(
      (report) =>
        report.laboratoryName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!dateFilter || report.uploadDate === dateFilter)
    );
    filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    setFilteredReports(filtered);
  }, [searchQuery, dateFilter, reportsData]);  */

  if (loading) {
    return <div>Loading...</div>;
  }
  const exportToExcel = () => {
    // Add Serial Numbers
    const dataWithSerialNumbers = filteredReports.map((row, index) => ({
      "S.No": index + 1, // Serial number
      "Lab Name": row.laboratoryName === "Other" ? row.customLabName : row.laboratoryName,
      "Total Amount": row.totalAmount,
      "Paid Amount": row.amountPaid,
      "Due Amount": row.dueAmount,
      "Issue Date": row.invoiceIssueDate,
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
      head: [["S.No", "Lab Name","Total Amount", "Paid Amount", "Due Amount", "Issue Date", "Upload Date"]], // Added "S.No"
      body: filteredReports.map((row, index) => [
        index + 1, // Serial number
        row.laboratoryName === "Other" ? row.customLabName : row.laboratoryName,
        row.totalAmount,
        row.amountPaid,
        row.dueAmount,
        row.invoiceIssueDate,
        row.uploadDate
      ]),
    });
  
    doc.save("Invoices_history.pdf");
  };
  

  const exportToWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph("Invoices_History"),
            new Table({
              rows: [
                // Table Header with Serial Number
                new TableRow({
                  children: ["S.No", "Lab Name","Total Amount", "Paid Amount", "Due Amount", "Issue Date", "Upload Date"].map(
                    (header) => new TableCell({ children: [new Paragraph(header)] })
                  ),
                }),
                // Table Data with Serial Number
                ...filteredReports.map((row, index) =>
                  
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(index + 1))] }), // Serial Number
                      new TableCell({ children: [new Paragraph(String(row.laboratoryName === "Other" ? row.customLabName : row.laboratoryName))] }),
                      new TableCell({ children: [new Paragraph(String(row.totalAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.amountPaid))] }),
                      new TableCell({ children: [new Paragraph(String(row.dueAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.invoiceIssueDate))] }),
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
    a.download = "Invoices_history.docx";
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(selectedFile && selectedFile.type.startsWith("image/") ? URL.createObjectURL(selectedFile) : null);
};
const handleSubmit = async (e) => {
  e.preventDefault();
  const finalLaboratoryName = selectedLab === "Other" ? customLabName : selectedLab;
  console.log(finalLaboratoryName, totalAmount, paidAmount, file, issueDate, isEditing);
  
  if (!finalLaboratoryName || !totalAmount || !paidAmount || (!file && !isEditing) || !issueDate) {
      alert("Please fill in all fields, including the invoice issue date and upload a file.");
      return;
  }

  const dueAmount = (parseFloat(totalAmount) - parseFloat(paidAmount)).toFixed(2);
  // const invoiceId = isEditing ? invoiceId : Date.now().toString(); // Ensure invoiceId is valid
  console.log(invoiceId);
  try {
      
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}_${(currentDate.getMonth() + 1).toString().padStart(2, '0')}_${currentDate.getDate().toString().padStart(2, '0')}`;
      const laboratoryName = selectedLab === "Other" ? customLabName : selectedLab;
 // Example output: 07_03_2025

      const formattedTime = currentDate.toLocaleTimeString();

      console.log(invoiceId);

      if (isEditing) {
          // Update existing invoice
          const invoiceQuery = query(collection(db, "invoices"), where("invoiceId", "==", invoiceId));
          const invoiceSnapshot = await getDocs(invoiceQuery);
          
          if (!invoiceSnapshot.empty) {
              let invoiceRef = invoiceSnapshot.docs[0].ref; // Get the first matching document
              let docSnap = await getDoc(invoiceRef); // Fetch document data
          
              // Update Firestore Document
              await updateDoc(invoiceRef, {
                  laboratoryName: laboratoryName,
                  customLabName: laboratoryName,
                  totalAmount: parseFloat(totalAmount),
                  amountPaid: parseFloat(paidAmount),
                  dueAmount,
                  uploadDate: formattedDate,
                  uploadTime: formattedTime,
                  invoiceIssueDate: issueDate,
              });
          
              console.log("Invoice updated successfully!");
          
              // Handle File Upload
              if (docSnap.exists() && file) {
                  try {
                      const oldFileName = docSnap.data().fileName;
                      if (oldFileName) {
                          const oldFileRef = ref(storage, `Invoices/${oldFileName}`);
                          await deleteObject(oldFileRef); // Delete old file
                      }
                  } catch (error) {
                      console.warn("Old file not found or deletion failed:", error);
                  }
          
                  // Get file extension safely
                  const fileExtension = file.name.includes('.') ? file.name.split('.').pop() : "";
                  const fileName = `${invoiceId}.${fileExtension}`;
                  const fileRef = ref(storage, `Invoices/${fileName}`);
          
                  await uploadBytes(fileRef, file);
                  const fileUrl = await getDownloadURL(fileRef);
          
                  // Update Firestore with file info
                  await updateDoc(invoiceRef, { fileName, fileUrl });
          
                  console.log("File updated successfully!");
              }
          } else {
              console.error("No matching invoice found for updating.");
          }
          
          

          // Updating the "Earning" collection if invoice is edited
          const earningQuery = query(collection(db, "Earning"), where("invoiceId", "==", invoiceId));
          const earningSnapshot = await getDocs(earningQuery);
          
          if (!earningSnapshot.empty) {
              earningSnapshot.forEach(async (earningDoc) => {
                  const earningRef = earningDoc.ref;
                  await updateDoc(earningRef, {
                      paymentType: "Labratory",
                      TotalAmount: parseFloat(totalAmount), 
                      PaidAmount: parseFloat(paidAmount),
                      dueAmount: dueAmount,
                      paymentTo: finalLaboratoryName,
                      createdAt: formattedDate,
                      createdTime: formattedTime,
                  });
              });
          }

          alert("Invoice updated successfully!");
      } else {
          // Add new invoice
          const LaboratoryId = Date.now();
          const InvoicesId = generateinvoiceId();
          const fileExtension = file.name.split('.').pop();
          const fileName = `${LaboratoryId}.${fileExtension}`;
          const fileRef = ref(storage, `Invoices/${fileName}`);
          await uploadBytes(fileRef, file);
          const fileUrl = await getDownloadURL(fileRef);
          const currentMonth = formattedDate.split("_").slice(0, 2).join("_"); // YYYY_MM
          //const laboratoryName = selectedLab === "Other" ? customLabName : selectedLab;

          const expenseQuery = query(
                collection(db, "invoices"),
                where("uploadDate", ">=", `${currentMonth}_01`),
                where("uploadDate", "<=", `${currentMonth}_31`),
                where("laboratoryName", "==", laboratoryName) 
              );
            
              const expenseSnapshot = await getDocs(expenseQuery);
              const billCount = expenseSnapshot.size; // Get the number of existing bills
              const billNumber = `Invoice ${billCount + 1}`; // Generate new bill number

          await addDoc(collection(db, "invoices"), {
              invoiceId : InvoicesId,
              LaboratoryId,
              laboratoryName: laboratoryName,
              customLabName:  laboratoryName || "",
              totalAmount: parseFloat(totalAmount),
              amountPaid: parseFloat(paidAmount),
              dueAmount,
              fileName,
              fileUrl,
              invoiceIssueDate: issueDate,
              uploadDate: formattedDate,
              uploadTime: formattedTime,
              billNumber,
          });

          // Add new entry to "Earning" collection
          await addDoc(collection(db, "Earning"), {
              paymentType: "Labratory",
              invoiceId :InvoicesId,
              patient_id: "",
              phoneNumber: "",
              paymentBy: "Dr. Nithya",
              TotalAmount: parseFloat(totalAmount),
              PaidAmount: parseFloat(paidAmount),
              dueAmount: dueAmount,
              paymentTo: finalLaboratoryName,
              createdAt: formattedDate,
              createdTime: formattedTime,
          });

          alert("Invoice uploaded successfully!");
      }

      navigate(0);
  } catch (error) {
      console.error("Error saving data:", error.message);
      alert("Failed to save data. Error: " + error.message);
  }
};
const generateinvoiceId = (length = 20) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};


    const handleDownload = async (report) => {
        try {
            const fileRef = ref(storage, `Invoices/${report.fileName}`);
            const downloadUrl = await getDownloadURL(fileRef);
            /* const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = report.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link); */
            window.open(downloadUrl, "_blank");
        } catch (error) {
            console.error("Error downloading file:", error.message);
            alert("Failed to download file. Error: " + error.message);
        }
    };

    const handleEdit = async (id) => {
      
      setIsOpen(true); // Show the form
  
      try {
        const docRef = doc(db, "invoices", id);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          
          const data = docSnap.data();
          console.log(data);
          setInvoiceId(data.invoiceId);
          console.log(invoiceId);
          setSelectedLab(data.laboratoryName || "");
          setCustomLabName(data.customLabName || "");
          setTotalAmount(data.totalAmount || "");
          setPaidAmount(data.amountPaid.toString() || "");
          setIssueDate(data.invoiceIssueDate || "");
          setIsEditing(true);

        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching invoice data:", error);
      }
    };


  // Sorting Function
  const sortedData = [...filteredReports].sort((a, b) => {
    if (sortConfig.key) {
      const order = sortConfig.direction === "asc" ? 1 : -1;
      return a[sortConfig.key] > b[sortConfig.key] ? order : -order;
    }
    return 0;
  });

  // Sorting Handler
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const paginatedData = rowsPerPage === "all" ? sortedData : sortedData.slice(indexOfFirstRow, indexOfLastRow);


  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
          <div className={`row pb-10 uploadInvoices ${isOpen ? "show" : ""}`}>
            <div className="card-box xs-pd-20-10 pd-ltr-20">
              <form >
                <h3> Upload Invoices</h3>
                <div className="row">
                  {/* Lab Name Dropdown */}
                  <div className="col-md-4 col-sm-12">
                    <div className="form-group">
                      <label>Lab Name</label>
                      <select
                        className="form-control"
                        value={selectedLab}
                        onChange={(e) => {
                          setSelectedLab(e.target.value);
                          if (e.target.value !== "Other") {
                            setCustomLabName("");
                          }
                        }}
                      >
                        <option value="">Select Lab</option>
                        <option value="Lab A">Lab A</option>
                        <option value="Lab B">Lab B</option>
                        <option value="Lab C">Lab C</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Lab Name (Appears when "Other" is selected) */}
                  {selectedLab === "Other" && (
                    <div className="col-md-4 col-sm-12">
                      <div className="form-group">
                        <label>Custom Lab Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={customLabName}
                          onChange={(e) => setCustomLabName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Patient Name Dropdown */}
                  
                  {/* Custom Patient Name (Appears when "Other" is selected) */}
                  <div className="col-md-4 col-sm-12">
                    <div className="form-group">
                      <label>Total Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Total Amount & Paid Amount Row */}
                <div className="row">
                  

                  <div className="col-md-4 col-sm-12">
                    <div className="form-group">
                      <label>Paid Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                      />
                    </div>
                  </div>
              
                  <div className="col-md-4 col-sm-12">
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

                  <div className="col-md-4 col-sm-12">
                    <div className="form-group">
                      <label>Upload Invoice (PDF/JPG)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf, .jpg, .jpeg, .png"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>

                
              

                {/* Submit Button */}
                <div className="row">
                  <div className="col-md-10 text-center" style={{marginBottom:"10px"}}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmit}
                    >
                      Submit
                    </button>
                    <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="row pb-10">
            
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
                <div style={{ textAlign: "left", fontSize: "25px", fontWeight: "bold" }}>Invoices History</div>
                <div className=" btn text-primary weight-500 hover:text-white " style={{ textAlign: "right", fontSize: "18px", fontWeight: "bold",cursor:"pointer"  }} onClick={() => setIsOpen(!isOpen)}><i className="ion-plus-round text-primary"></i> Upload Invoices</div>
                        
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end", // Aligns content to the right
                  width: "100%",
                  padding: "10px",
                  marginLeft: "10px",
                }}
              >
                
              <div className="filter-container">
                <input type="text" placeholder="Search" className="alloversearchbar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}  style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none" ,  }} />
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
                    
                    <th className="table-plus">Laboratory Name</th>
                    <th className="table-plus">Invoice No.</th>
                    
                    <th>Total Amount</th>
                    <th>Amount Paid</th>
                    <th>Due Amount</th>
                    <th>Issue Date</th>
                    
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
                      <td className="table-plus">{report.laboratoryName === "Other" ? report.customLabName : report.laboratoryName}</td>
                      <td>{report.billNumber || "N/A"}</td>
                      <td>{report.totalAmount}</td>
                      <td>{report.amountPaid}</td>
                      <td>{report.dueAmount}</td>
                      <td>{report.invoiceIssueDate}</td>
                      <td>
                        <div className="table-actions" style={{display:"flex" , gap:"20px"}}>
                            <a href="#" data-color="#265ed7" onClick={() => handleEdit(report.id)}>
                              <i className="icon-copy dw dw-edit2" onClick={() => setIsOpen(!isOpen)}></i>
                            </a>
                            <a href="#" data-color="#e95959" onClick={() => handleDownload(report)}>
                              <i className="fa fa-download"></i>

                            </a>
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
          </div>
          <div className="row pb-10">    
              <div 
                          style={{ 
                              marginTop: "15px", 
                              display: "flex", 
                              gap: "10px",
                              flexWrap: "wrap", 
                              justifyContent: "center" // Align buttons properly in mobile view
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
    </div>
  );
}

export default ViewReport;
