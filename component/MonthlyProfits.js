import { useEffect, useState } from "react";
import "../vendors/styles/core.css";
import "../vendors/styles/icon-font.min.css";
import "../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../vendors/styles/style.css";
import dayjs from "dayjs";
import "bootstrap/dist/css/bootstrap.min.css";
import "./loading.css";
import { db } from "./Config/FirebaseConfig"; 
import { collection, getDocs } from "firebase/firestore";
import { FaFileWord, FaFilePdf, FaFileExcel, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

function MonthlyProfit() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Function to process earnings data into monthly buckets
    const processEarnings = (earnings) => {
        const monthMap = {};

        earnings.forEach((earning) => {
            const createdMonth = earning.createdAt
                ? dayjs(earning.createdAt.replace(/_/g, "-"), "YYYY-MM-DD").format("MMMM YYYY")
                : null;

            if (createdMonth) {
                if (!monthMap[createdMonth]) {
                    monthMap[createdMonth] = {
                        month: createdMonth,
                        drPaid: 0,
                        drDue: 0,
                        patientPaid: 0,
                        patientDue: 0,
                        Paymenttoconsultant: 0,
                        PaymenttoLabratory: 0,
                        paymenttoPersonalBill: 0,
                        paymenttoWaterBill: 0,
                        paymenttoElectricBill: 0,
                    };
                }
                if (earning.paymentBy === "Dr. Nithya") {
                    monthMap[createdMonth].drPaid += parseFloat(earning.PaidAmount) || 0;
                    monthMap[createdMonth].drDue += parseFloat(earning.dueAmount) || 0;
                }
                if (earning.paymentTo === "Dr. Nithya") {
                    monthMap[createdMonth].patientPaid += parseFloat(earning.PaidAmount) || 0;
                    monthMap[createdMonth].patientDue += parseFloat(earning.dueAmount) || 0;
                }
                if (earning.paymentType === "Consultant") {
                    monthMap[createdMonth].Paymenttoconsultant += parseFloat(earning.PaidAmount) || 0;
                }
                if (earning.paymentType === "Labratory") {
                    monthMap[createdMonth].PaymenttoLabratory += parseFloat(earning.PaidAmount) || 0;
                }
                if (earning.paymentType === "personal_bill") {
                    monthMap[createdMonth].paymenttoPersonalBill += parseFloat(earning.PaidAmount) || 0;
                }
                if (earning.paymentType === "water_bill") {
                    monthMap[createdMonth].paymenttoWaterBill += parseFloat(earning.PaidAmount) || 0;
                }
                if (earning.paymentType === "electric_bill") {
                    monthMap[createdMonth].paymenttoElectricBill += parseFloat(earning.PaidAmount) || 0;
                }
            }
        });
        return Object.values(monthMap).sort((a, b) => 
            dayjs(b.month, "MMMM YYYY").valueOf() - dayjs(a.month, "MMMM YYYY").valueOf()
        );
    };

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const earningsRef = collection(db, "Earning");
                const snapshot = await getDocs(earningsRef);
                const earnings = snapshot.docs.map((doc) => doc.data());
                const allMonthlyData = processEarnings(earnings);
                setMonthlyData(allMonthlyData);
            } catch (error) {
                console.error("Error fetching earnings:", error);
            }
        };
        fetchEarnings();
    }, []);

    // Filter data for search and month
    const filteredData = monthlyData.filter((data) => {
        const matchesSearch = searchQuery === "" || data.month.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMonthFilter = monthFilter === "" || data.month.includes(dayjs(monthFilter).format("MMMM YYYY"));
        return matchesSearch && matchesMonthFilter;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Export Functions
    const exportToExcel = () => {
        // Define structured data similar to the PDF format
        const dataWithSerialNumbers = filteredData.map((row, index) => ({
            "S.No": index + 1,
            "Month": row.month,
            "Total Earning": row.patientPaid.toFixed(2),
            "Total Expenses": `${row.PaymenttoLabratory}(Labratory) + ${row.Paymenttoconsultant}(Consultant) + ${row.paymenttoWaterBill}(Water Bill) + ${row.paymenttoElectricBill}(Electric Bill) + ${row.paymenttoPersonalBill}(Personal Bill)`,
            "Total Profit": (row.patientPaid - row.drPaid > 0 ? (row.patientPaid - row.drPaid).toFixed(2) : 0),
            "Total Loss": (row.patientPaid - row.drPaid < 0 ? Math.abs(row.patientPaid - row.drPaid).toFixed(2) : 0)
        }));
    
        // Create a new workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(dataWithSerialNumbers);
        const workbook = XLSX.utils.book_new();
    
        // Append the worksheet with a title
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Earning History");
    
        // Write the Excel file
        XLSX.writeFile(workbook, "Monthly_Earnings.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Monthly Earning History", 20, 10);
        doc.autoTable({
            head: [["Month", "Total Earning", "Total Expenses", "Total Profit", "Total Loss"]],
            body: filteredData.map(data => [
                data.month,
                data.patientPaid.toFixed(2),
                data.PaymenttoLabratory +"(Labratory ) + " + data.Paymenttoconsultant +"( Consultant ) + " + data.paymenttoWaterBill +"( Water Bill) + " + data.paymenttoElectricBill +"( Electric Bill ) + " + data.paymenttoPersonalBill +"(Personal Bill )",
                (data.patientPaid - data.drPaid > 0 ? (data.patientPaid - data.drPaid).toFixed(2) : 0),
                (data.patientPaid - data.drPaid < 0 ? Math.abs(data.patientPaid - data.drPaid).toFixed(2) : 0)
            ]),
        });
        doc.save("Monthly_Earnings.pdf");
    };

    return (
        <div className="App">
            <div className="main-container">
                <div className="xs-pd-20-10 pd-ltr-20">
                    <div className="card-box pb-10">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
                            <div style={{ fontSize: "25px", fontWeight: "bold" }}>Monthly Earning History</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}>
                            <input
                                type="text"
                                placeholder="Search by Month"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px" }}
                            />
                            <input
                                type="month"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", marginLeft: "10px" }}
                            />
                        </div>
                        <table className="data-table table nowrap table-striped">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Total Earning</th>
                                    <th>Total Expenses</th>
                                    <th>Total Profit</th>
                                    <th>Total Loss</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                                    </tr>
                                ) : (currentItems.map((data) => (
                                    <tr key={data.month}>
                                        <td>{data.month}</td>
                                        <td>{data.patientPaid.toFixed(2)}</td>
                                        <td>{data.PaymenttoLabratory +"(Labratory ) + " + data.Paymenttoconsultant +"( Consultant ) + " + data.paymenttoWaterBill +"( Water Bill) + " + data.paymenttoElectricBill +"( Electric Bill ) + " + data.paymenttoPersonalBill +"(Personal Bill )"}</td>
                                        <td>{(data.patientPaid - data.drPaid > 0 ? data.patientPaid - data.drPaid : 0).toFixed(2)}</td>
                                        <td>{(data.patientPaid - data.drPaid < 0 ? Math.abs(data.patientPaid - data.drPaid) : 0).toFixed(2)}</td>
                                        
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                        <div className="pagination-controls">
                            <button  disabled={currentPage === 1}  onClick={() => paginate(currentPage - 1)} >
                                <FaChevronLeft />
                            </button>
                            <span>{currentPage} / {totalPages}</span>
                            <button  disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)} >
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MonthlyProfit;
