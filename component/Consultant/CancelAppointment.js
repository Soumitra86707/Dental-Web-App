import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../Config/FirebaseConfig";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, arrayUnion ,query,where,deleteDoc}  from "firebase/firestore";
import { toast } from "react-toastify";
import Prescription from "../Prescription/EditPrescription";

const CancelConsultantAppointment = () => {
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [issueDate, setIssueDate] = useState(null);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 6;

  const weekDayToNumber = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  useEffect(() => {
    const fetchConsultants = async () => {
      const querySnapshot = await getDocs(collection(db, "consultants"));
      const consultantsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().fname + " " + doc.data().lname,
      }));
      setConsultants(consultantsList);
    };

    fetchConsultants();
  }, []);

  const handleCheckboxChange = (patient) => {
    setSelectedPatients((prevSelected) => {
      const alreadySelected = prevSelected.find(p => p.id === patient.id);
      if (alreadySelected) {
        return prevSelected.filter(p => p.id !== patient.id);
      } else {
        return [...prevSelected, patient];
      }
    });
  };

  const handleConsultantChange = async (name) => {
    const selected = consultants.find(c => c.name === name);
    if (!selected) return;

    setSelectedConsultant(selected);
    setIssueDate(null);

    const docRef = doc(db, "consultants", selected.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.availability && Array.isArray(data.availability)) {
        const numericDays = data.availability.map(day => weekDayToNumber[day.toLowerCase()]);
        setAvailableDays(numericDays);
      }
    }
  };

  const isDayDisabled = (date) => {
    const day = date.getDay();
    return !availableDays.includes(day);
  };
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedConsultant) return;
  
      const today = new Date().toLocaleDateString("en-CA");
  
      const appointmentsQuery = query(
        collection(db, "Consultantappointments"),
        where("consultantId", "==", selectedConsultant.id),
        where("date", ">=", today) // future dates only
      );
  
      const querySnapshot = await getDocs(appointmentsQuery);
      const appointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      setPatients(appointments);
    };
  
    fetchAppointments();
  }, [selectedConsultant]);
  
  

  // 🔥 NEW: Filter patients who have the selected consultant on selected date
  const filteredPatients = patients.filter((patient) => {
    const matchSearch = `${patient.patientName} ${patient.reason}`.toLowerCase().includes(searchTerm.toLowerCase());
  
    if (issueDate) {
      const selectedDate = issueDate.toLocaleDateString("en-CA");
      return matchSearch && patient.date === selectedDate;
    }
  
    return matchSearch; // If no date selected, return all future for consultant
  });

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const renderRows = () => {
    if (currentPatients.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="text-center text-muted">
            No data available for the selected consultant and date.
          </td>
        </tr>
      );
    }
  
    const rows = [];
    for (let i = 0; i < currentPatients.length; i += 3) {
      const row = (
        <tr key={i}>
          {[0, 1, 2].map(j => {
            const patient = currentPatients[i + j];
            return patient ? (
              <React.Fragment key={j}>
                <td>{patient.patientName} - {patient.reason}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedPatients.some(p => p.id === patient.id)}
                    onChange={() => handleCheckboxChange({
                        id: patient.id,
                        PrescriptionId: patient.prescriptionId,
                        name: patient.patientName,
                        reason: patient.reason,
                        appointmentId: patient.appointmentId, // Make sure this is available in the patient object
                      })}
                  />
                </td>
              </React.Fragment>
            ) : (
              <>
                <td>--</td>
                <td>--</td>
              </>
            );
          })}
        </tr>
      );
      rows.push(row);
    }
    return rows;
  };
  
  const handleCancel = async (e) => {
    e.preventDefault();
  
    if (!selectedConsultant  || selectedPatients.length === 0) {
      toast.error("Please fill all fields and select patients");
      return;
    }
    if(issueDate){
      const selectedDate = issueDate.toLocaleDateString("en-CA");
    }
    
    try {
      
  
      const cancelPromises = selectedPatients.map(async (patient) => {
        const { id: patientId,PrescriptionId:PrescriptionId, appointmentId } = patient;
        console.log("hjddhj",appointmentId);
        // 🔥 1. Update the prescriptions > consultants array by removing the matching checkId
        const prescriptionRef = doc(db, "prescriptions", PrescriptionId);
        const prescriptionSnap = await getDoc(prescriptionRef);
  
        if (prescriptionSnap.exists()) {
            console.log("hjddsfdsfhj",appointmentId);
          const data = prescriptionSnap.data();
          const consultants = data.consultants || [];

          const updatedConsultants = consultants.filter(
            (c) =>
              !(
                c.checkId === appointmentId 
              )
          );
          console.log("updatedConsultants",updatedConsultants)
          await updateDoc(prescriptionRef, {
            consultants: updatedConsultants,
          });
        }
  
        // 🔥 2. Remove from Consultantappointments collection
        const q = query(
            collection(db, "Consultantappointments"),
            where("appointmentId", "==", patient.appointmentId) // or whatever you're checking
          );
          const snapshot = await getDocs(q);
          
          snapshot.forEach(async (docSnap) => {
            await deleteDoc(doc(db, "Consultantappointments", docSnap.id));
          });
      });
  
      await Promise.all(cancelPromises);
      toast.success("Appointments cancelled successfully!", {
        autoClose: 3000, // 10 seconds
        className: "custom-toast",
        closeOnClick: false,
        draggable: false,
        progress: undefined,
      });
  
      // Redirect to dashboard after 10 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      //toast.success("Appointments cancelled successfully!");
      
      setSelectedPatients([]);
      setIssueDate(null);
      setSelectedConsultant("");
    } catch (error) {
      console.error("Error cancelling appointment: ", error);
      toast.error("Something went wrong while cancelling.");
    }
  };
  
  
  
  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
          <div className="card-box xs-pd-20-10 pd-ltr-20">
            <form onSubmit={handleCancel}>
              <h3>Consultant Cancel Appoinment Form</h3>
              <div className="row">
                <div className="col-md-4 col-sm-12">
                  <div className="form-group">
                    <label>Choose Consultant</label>
                    <select
                      className="form-control"
                      value={selectedConsultant.name || ""}
                      onChange={(e) => handleConsultantChange(e.target.value)}
                      required
                    >
                      <option value="">Select Consultant</option>
                      {consultants.map((consultant) => (
                        <option key={consultant.id} value={consultant.name}>
                          {consultant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-4 col-sm-12">
                  <div className="form-group">
                    <label>Select Date</label>
                    <div className="form-control p-0">
                      <DatePicker
                        selected={issueDate}
                        onChange={(date) => setIssueDate(date)}
                        filterDate={(date) => !isDayDisabled(date)}
                        placeholderText="Pick a valid day"
                        dateFormat="yyyy-MM-dd"
                        minDate={new Date()}
                        className="w-100 border-0 px-2 py-1"
                        
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="Booking-Consultant-PatientTable-Heading" style={{ display: "flex", justifyContent: "space-between" }}>
                  <h4>Patients Table</h4>
                  <div className="form-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <table className="table table-bordered text-center">
                  <thead className="thead-light">
                    <tr>
                      <th>Patient - Reason</th>
                      <th>Select</th>
                      <th>Patient - Reason</th>
                      <th>Select</th>
                      <th>Patient - Reason</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>{renderRows()}</tbody>
                </table>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="row" style={{ marginBottom: "50px", display: "flex", justifyItems: "center", alignItems: "center" }}>
                <div className="col-md-12 text-center" style={{ marginBottom: "50px" }}>
                  <button type="submit" className="btn btn-primary">
                    Cancel Appoinment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelConsultantAppointment;
