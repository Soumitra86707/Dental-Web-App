import { useEffect, useState } from "react";
import { Router,Routes,Route,Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Cookies from "js-cookie";
import "./App.css";
import Landingpage from "./component/landingpage/landingpage";
import Topbar from "./component/topbar";
import DashBoard from "./component/loading";
import PatientsDiary from "./component/patientsDiary";
import PaymentDiary from "./component/PaymentDiary";
import ViewAppointment from "./component/AppointmentManagement/ViewAppointment";
import ViewConsultant from "./component/Consultant/ViewConsultant";
import ViewReport from "./component/Report/ViewReport";
import ViewInvoices from "./component/Report/ViewInvoices";
/* import BookAppointment from "./component/AppointmentManagement/book"; */
import Profile from "./component/profile/profile";
import 'bootstrap/dist/css/bootstrap.min.css';
import UploadReport from "./component/Report/UploadReports";
/* import UploadReport from "./component/Prescription/Prescription"; */
import UploadInvoices from "./component/Report/UploadInvoices";
import { createBrowserHistory } from "history";
import EditPrescription from "./component/Prescription/EditPrescription";
import BookAppointment from "./component/AppointmentManagement/BookAppointment";
import RescheduleAppointment from "./component/AppointmentManagement/RescheduleAppointment";
import CancelBooking from "./component/AppointmentManagement/CancelBooking";
import Prescription from "./component/Prescription/Prescription";
import DownloadPrescription from "./component/Prescription/DownloadPrescription";
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
    const savedExpiration = Cookies.get(COOKIE_KEY);
    const savedAuthState = localStorage.getItem("isAuthenticated") === "true";
    const currentTime = new Date().getTime();

    if (savedExpiration && savedAuthState) {
      if (currentTime > savedExpiration) {
        handleLogout();
      } else {
        setIsAuthenticated(true);
      }
    } else {
      handleLogout();
    }
    setIsCheckingAuth(false); // Mark authentication check as complete
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
            <Route path="/Prescription/Download/:prescriptionId" element={<DownloadPrescription />} />
            <Route path="/Prescription/edit/:prescriptionId" element={<EditPrescription />} />
            <Route path="/Report/ViewReports" element={<ViewReport />} />
            <Route path="/Report/ViewInvoices" element={<ViewInvoices />} />
            <Route path="/Report/UploadReports" element={<UploadReport />} />
            <Route path="/Report/UploadInvoices" element={<UploadInvoices />} />
            <Route path="/appointments/ViewAppointment" element={<ViewAppointment />} />
            <Route path="/appointments/BookAppointment" element={<BookAppointment />} />
            <Route path="/appointments/RescheduleAppointment" element={<RescheduleAppointment />} />
            <Route path="/appointments/CancelAppointment" element={<CancelBooking />} />
            <Route path="/addprescription/:appointmentId" element={<Prescription />} />
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
