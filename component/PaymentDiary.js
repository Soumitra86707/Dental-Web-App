import { useEffect, useState } from "react";
import "../vendors/styles/core.css";
import "../vendors/styles/icon-font.min.css";
import "../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../vendors/styles/style.css";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "./loading.css";
import { FaFileCsv, FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";
import React from "react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from "docx";
import { db } from "./Config/FirebaseConfig"; // Ensure firebase is configured properly
import { collection, getDocs ,query, where, limit } from "firebase/firestore";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import EarningChart from "./EarningChart.js";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function PaymentDiary() {
  const [reportData, setReportData] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("1-day");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [chartData, setChartData] = useState({
    lastSixMonths: [],
    lastYear: [],
  });
  const [timeRange, setTimeRange] = useState("6months"); // Default: Last 6 months
    const [prescriptions, setPrescriptions] = useState([]);
    useEffect(() => {
      const fetchPrescriptions = async () => {
          try {
              const prescriptionsCollection = collection(db, "Earning");
  
              // Fetch first 20 documents
              const first20Query = query(prescriptionsCollection, limit(2));
              const first20Snapshot = await getDocs(first20Query);
              const first20List = first20Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setPrescriptions(first20List); // Show first 20 quickly
  
              // Fetch all documents after 3 seconds
              setTimeout(async () => {
                const fullSnapshot = await getDocs(prescriptionsCollection);
                const fullList = fullSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPrescriptions(fullList);
                setLoading(false);  // ✅ Stop loading after fetching
            }, 3000);
  
          }catch (error) {
            console.error("Error fetching prescriptions:", error);
            setLoading(false);  // ✅ Stop loading even if there is an error
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
            report.paymentBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.paymentTo?.toLowerCase().includes(searchQuery.toLowerCase())
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
                  if (!report.createdAt) return null;  // Handle null or undefined values
      
                  const parsedDate = new Date(report.createdAt.replace(/_/g, "-"));
                  if (isNaN(parsedDate)) {
                      console.warn("Invalid Date:", report.createdAt);
                      return null;
                  }
      
                  return parsedDate.toISOString().slice(0, 7); // Extract YYYY-MM
              })();
      
              
              return createdMonth === monthFilter;
          });
      }
      
      
    
        
        // Fix sorting: Use `createdAt` instead of `uploadDate`
        filtered.sort((a, b) => new Date(b.createdAt.replace(/_/g, "-")) - new Date(a.createdAt.replace(/_/g, "-")));
        
        setFilteredReports(filtered);
    };

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const earningsRef = collection(db, "Earning");
        const snapshot = await getDocs(earningsRef);
        const earnings = snapshot.docs.map((doc) => doc.data());

        const today = dayjs();
        const lastSixMonthsData = {};
        const lastYearData = {};

        // Initialize months
        for (let i = 0; i < 12; i++) {
          const month = today.subtract(i, "month").format("YYYY_MM");
          lastYearData[month] = { drPaid: 0, drDue: 0, patientPaid: 0, patientDue: 0 };
          if (i < 6) {
            lastSixMonthsData[month] = { drPaid: 0, drDue: 0, patientPaid: 0, patientDue: 0 };
          }
        }

        // Process earnings data
        earnings.forEach((earning) => {
          const createdMonth = earning.createdAt 
          ? dayjs(earning.createdAt.replace(/_/g, "-"), "YYYY-MM-DD").format("YYYY_MM") 
          : null;



          if (lastYearData[createdMonth]) {
            if (earning.paymentBy === "Dr. Nithya") {
              // If Dr. Nithya paid, track as "Doctor Paid"
              lastYearData[createdMonth].drPaid += parseFloat(earning.PaidAmount) || 0;
              lastYearData[createdMonth].drDue += parseFloat(earning.dueAmount) || 0;
            }
            if (earning.paymentTo === "Dr. Nithya") {
              // If payment is to the doctor, it's a patient's payment
              lastYearData[createdMonth].patientPaid += parseFloat(earning.PaidAmount) || 0;
              lastYearData[createdMonth].patientDue += parseFloat(earning.dueAmount) || 0;
            }
          }

          if (lastSixMonthsData[createdMonth]) {
            if (earning.paymentBy === "Dr. Nithya") {
              lastSixMonthsData[createdMonth].drPaid += parseFloat(earning.PaidAmount) || 0;
              lastSixMonthsData[createdMonth].drDue += parseFloat(earning.dueAmount) || 0;
            }
            if (earning.paymentTo === "Dr. Nithya") {
              lastSixMonthsData[createdMonth].patientPaid += parseFloat(earning.PaidAmount) || 0;
              lastSixMonthsData[createdMonth].patientDue += parseFloat(earning.dueAmount) || 0;
            }
          }
        });

        setChartData({
          lastSixMonths: Object.entries(lastSixMonthsData).reverse(),
          lastYear: Object.entries(lastYearData).reverse(),
        });
      } catch (error) {
        console.error("Error fetching earnings:", error);
      }
    };

    fetchEarnings();
  }, []);

/*   if (loading) {
    return <div>Loading...</div>;
  } */



  // Calculate total pages
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  // Export full table as Excel
  const exportExcel = () => {
    // Add Serial Numbers
    const dataWithSerialNumbers = filteredReports.map((row, index) => ({
      "S.No": index + 1, // Serial number
      "Payment By": row.paymentBy,
      "Payment Date": row.createdAt,
      "Paid": row.PaidAmount,
      "Due": row.dueAmount,
      "Payment To": row.paymentTo,
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(dataWithSerialNumbers); // Use modified data
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Payment History");
    XLSX.writeFile(workbook, "Payment_History.xlsx");
  };
  


  // Export full table as PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Payment_History", 20, 10);
  
    doc.autoTable({
      head: [["S.No", "Payment By", "Payment Date", "Paid", "Due", "Payment To"]], // Added "S.No"
      body: filteredReports.map((row, index) => [
        index + 1, // Serial number
        row.paymentBy,
        row.createdAt,
        row.PaidAmount,
        row.dueAmount,
        row.paymentTo
      ]),
    });
  
    doc.save("Payment_history.pdf");
  };
  
  

  // Export full table as Word document
  const exportWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph("Payment_History"),
            new Table({
              rows: [
                // Table Header with Serial Number
                new TableRow({
                  children: ["S.No", "Payment By", "Payment Date","Total Amount", "Paid Amount", "Due Amount", "Payment To"].map(
                    (header) => new TableCell({ children: [new Paragraph(header)] })
                  ),
                }),
                // Table Data with Serial Number
                ...filteredReports.map((row, index) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(index + 1))] }), // Serial Number
                      new TableCell({ children: [new Paragraph(String(row.paymentBy))] }),
                      new TableCell({ children: [new Paragraph(String(row.createdAt))] }),
                      new TableCell({ children: [new Paragraph(String(row.TotalAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.PaidAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.dueAmount))] }),
                      new TableCell({ children: [new Paragraph(String(row.paymentTo))] }),
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
    a.download = "Payment_history.docx";
    a.click();
    URL.revokeObjectURL(url);
  };
  



  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
          <div className="row pb-10">
                    <div className="col-md-12 mb-20">
                      <div className="card-box height-100-p pd-20">
                        <div className="d-flex flex-wrap justify-content-between align-items-center pb-0 pb-md-3">
                        <div className="h5 mb-md-0">Payment Activities</div>
                        <div className="form-group  mb-md-0 mb-3">

                          <select className="form-control form-control-sm" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                            <option value="6months">Last 6 Months</option>
                            <option value="1year">Last 1 Year</option>
                          </select>
                        </div>
                      </div>
                        <EarningChart  chartData={timeRange === "6months" ? chartData.lastSixMonths : chartData.lastYear} 
                          timeRange={timeRange} />                      
                  </div>
                </div>
          </div>
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
              <div style={{ textAlign: "left", fontSize: "25px", fontWeight: "bold" }}>Payment History</div>
                                        
            </div>
            <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end", // Aligns content to the right
                  width: "100%",
                  padding: "10px",
                  gap: "5px",
                }}
              >
                            
              <div className="filter-container">

                  <input type="text" placeholder="Search" className="alloversearchbar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                    style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none",}} />
                    <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
                      style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1 }} 
                    />

                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                      style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1 }} 
                    />
    
            </div>
            </div>

            <table className="data-table table nowrap table-striped PaymentTable">
                <thead className="bg-gray">
                    <tr>
                        <th>Serial No.</th>
                        <th className="table-plus">Payment By</th>
                        <th>Payment Date</th>
                        <th>Paid</th>
                        <th>Due</th>
                        <th>Payment To</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                        </tr>
                    ) : (
                        currentItems.map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray"}>
                                <td>{indexOfFirstItem + index + 1}</td>
                                <td className="table-plus">
                                    <div className="name-avatar d-flex align-items-center">
                                        <div className="txt">
                                            <div className="weight-600">{row.paymentBy}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{row.createdAt}</td>
                                <td>{row.PaidAmount}</td>
                                <td>{row.dueAmount}</td>
                                <td>{row.paymentTo}</td>
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
            {/* Download Buttons */}
            <div 
              style={{ 
                marginTop: "15px", 
                display: "flex", 
                gap: "10px",
                flexWrap: "wrap", 
                justifyContent: "center", // Align buttons properly in mobile view
              }}
            >
              <button className="btn btn-success" onClick={exportExcel}>
                <FaFileExcel /> Download Excel
              </button>
              <button className="btn btn-danger" onClick={exportPDF}>
                <FaFilePdf /> Download PDF
              </button>
              <button className="btn btn-info" onClick={exportWord}>
                <FaFileWord /> Download Word
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentDiary;
