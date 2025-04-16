import { useEffect, useState } from "react";
import { Router,Routes,Route,Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Cookies from "js-cookie";
import "./App.css";
import Landingpage from "./component/landingpage/landingpage";
import Topbar from "./component/topbar";

import DashBoard from "./component/loading";

/* History Management */
import PatientsDiary from "./component/patientsDiary";
import PaymentDiary from "./component/PaymentDiary";
import MonthlyProfit from "./component/MonthlyProfits";

/* Appoinment Management */
import ViewAppointment from "./component/AppointmentManagement/ViewAppointment";
import BookAppointment from "./component/AppointmentManagement/BookAppointment";
import RescheduleAppointment from "./component/AppointmentManagement/RescheduleAppointment";
import CancelBooking from "./component/AppointmentManagement/CancelBooking";

/* Consultant Management */
import AddConsultant from "./component/Consultant/AddConsultant";
import ViewConsultant from "./component/Consultant/ViewConsultant";
import BookingConsultant from "./component/Consultant/BookingConsultant";
import RescheduleConsultantAppointment from "./component/Consultant/RescheduleAppointment";
import CancelAppointment from "./component/Consultant/CancelAppointment"; 
import PaymentConsultant from "./component/Consultant/paymentHistory";

/* Lab Management */
import ViewReport from "./component/Report/ViewReport";
import ViewInvoices from "./component/Report/ViewInvoices";
import ViewExpenses from "./component/Report/ExtraExpences";
import PatientsBilling from "./component/Report/PatientsBiling"

/* Profile */
import Profile from "./component/profile/profile";

/* Prescription */
import EditPrescription from "./component/Prescription/EditPrescription";
import Prescription from "./component/Prescription/Prescription";
import DownloadPrescription from "./component/Prescription/DownloadPrescription";


import 'bootstrap/dist/css/bootstrap.min.css';
import { createBrowserHistory } from "history";
const history = createBrowserHistory();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const COOKIE_KEY = "session_expiration";

  // Handles Login
  const handleLogin = () => {
    const expirationTime = new Date().getTime() + SESSION_TIMEOUT;
    Cookies.set(COOKIE_KEY, expirationTime, { expires: new Date(expirationTime) });
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  // Handles Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    Cookies.remove(COOKIE_KEY);
    localStorage.removeItem("isAuthenticated");
  };

  // Check Session Expiration on Load
  useEffect(() => {
    const checkSession = () => {
      const savedExpiration = Cookies.get(COOKIE_KEY);
      const currentTime = new Date().getTime();
  
      if (savedExpiration && currentTime > parseInt(savedExpiration)) {
        handleLogout(); // Expire if session is stale
      }
    };
  
    const refreshSession = () => {
      const expirationTime = new Date().getTime() + SESSION_TIMEOUT;
      Cookies.set(COOKIE_KEY, expirationTime, { expires: new Date(expirationTime) });
    };
  
    const savedExpiration = Cookies.get(COOKIE_KEY);
    const savedAuthState = localStorage.getItem("isAuthenticated") === "true";
    const currentTime = new Date().getTime();
  
    if (savedExpiration && savedAuthState) {
      if (currentTime > savedExpiration) {
        handleLogout();
      } else {
        setIsAuthenticated(true);
        refreshSession(); // Initial refresh on load if still valid
      }
    } else {
      handleLogout();
    }
  
    // ✅ Periodically check for session expiration (every 1 min)
    const intervalId = setInterval(checkSession, 60 * 1000);
  
    // ✅ Refresh session on user activity
    window.addEventListener("mousemove", refreshSession);
    window.addEventListener("keydown", refreshSession);
    window.addEventListener("click", refreshSession);
  
    setIsCheckingAuth(false); // Done checking auth on load
  
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mousemove", refreshSession);
      window.removeEventListener("keydown", refreshSession);
      window.removeEventListener("click", refreshSession);
    };
  }, []);
  

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <ToastContainer />

      {/* Show Topbar only if authenticated */}
      {isAuthenticated && <Topbar onLogout={handleLogout} />}

      <Routes>
        {/* Keep the user on the same page after refresh */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/Dashboard" replace /> : <Landingpage onLogin={handleLogin} />} />

        {/* Protect routes by checking authentication */}
        {isAuthenticated ? (
          <>
            <Route path="/Dashboard" element={<DashBoard />} />
            <Route path="/Profile" element={<Profile />} />
            <Route path="/Diary/patientsDetails" element={<PatientsDiary />} />
            <Route path="/Diary/PaymentDetails" element={<PaymentDiary />} />
            <Route path="/Consultant/View" element={<ViewConsultant />} />
            <Route path="/Consultant/AddConsultant" element={<AddConsultant />} />
            <Route path="/Consultant/AddConsultant/:id" element={<AddConsultant />} />
            <Route path="/Consultant/BookAppointment" element={<BookingConsultant />} />
            <Route path="/Consultant/CancelAppointment" element={<CancelAppointment />} />
            <Route path="/Consultant/RescheduleAppointment" element={<RescheduleConsultantAppointment />} />
            <Route path="/Consultant/PaymentHistory" element={<PaymentConsultant />} />
            <Route path="/Prescription/Download/:prescriptionId" element={<DownloadPrescription />} />
            <Route path="/Prescription/edit/:prescriptionId" element={<EditPrescription />} />
            <Route path="/Report/ViewReports" element={<ViewReport />} />
            <Route path="/Report/ViewInvoices" element={<ViewInvoices />} />
            <Route path="/Report/ExtraExpenses" element={<ViewExpenses />} />
            <Route path="/Report/PatientsBilling" element={<PatientsBilling />} />
            
            <Route path="/appointments/ViewAppointment" element={<ViewAppointment />} />
            <Route path="/appointments/BookAppointment" element={<BookAppointment />} />
            <Route path="/appointments/RescheduleAppointment" element={<RescheduleAppointment />} />
            <Route path="/appointments/CancelAppointment" element={<CancelBooking />} />
            <Route path="/addprescription/:appointmentId" element={<Prescription />} />

            <Route path="/MonthlyProfit" element={<MonthlyProfit />} />
          </>
        ) : (
          // Redirect all other routes to home (login page) only if NOT authenticated
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
