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
import { collection, getDocs ,query, where } from "firebase/firestore";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import EarningChart from "./EarningChart.js";

function PaymentDiary() {
  const [reportData, setReportData] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("1-day");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    lastSixMonths: [],
    lastYear: [],
  });
  const [timeRange, setTimeRange] = useState("6months"); // Default: Last 6 months
    const [prescriptions, setPrescriptions] = useState([]);
    useEffect(() => {
        const fetchPrescriptions = async () => {
            const prescriptionsCollection = collection(db, "Earning");
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
            report.paymentBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.paymentTo?.toLowerCase().includes(searchQuery.toLowerCase())
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

console.log("kjhfdbsnjfh",uploadDate); // Output: "2025-03-08"
 
        
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
                                }}
                            >
                            
              <div className="filter-container">
                <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                  style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", width: "150px" }} />
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

            <table className="data-table table nowrap   table-striped">
              <thead>
                <tr>
                  <th>Serial No.</th>
                  <th className="table-plus">Payment By</th>
                  <th>Payment Date</th>
                  <th>Paid</th>
                  <th>Due</th>
                  
                  <th>Payment To</th>
                  
                  {/* <th className="datatable-nosort">Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                  </tr>
                ) : (
                  filteredReports.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray"}>
                      <td>{index +1}</td>
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
                      
                      {/* <td>
                      <a href="#" data-color="#e95959" onClick={() => downloadRowPDF(row)}>
                              <i className="fa fa-download"></i>

                            </a>
                        
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

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
