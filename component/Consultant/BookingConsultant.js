import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../Config/FirebaseConfig";
import { collection, getDocs, doc, getDoc,addDoc,updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "react-toastify";


const PatientForm = () => {
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [issueDate, setIssueDate] = useState(null);
  const [selectedPatients, setSelectedPatients] = useState([]);
const [columnsPerRow, setColumnsPerRow] = useState(3);
  const patientsPerPage = 25;

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1200) setColumnsPerRow(4);
      else if (width >= 768) setColumnsPerRow(3);
      else setColumnsPerRow(2);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

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
  
    setSelectedConsultant(selected); // ← Save whole object, not just name
    setIssueDate(null); // reset date on change
  
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
    const day = date.getDay(); // 0 - 6
    return !availableDays.includes(day);
  };
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  

  useEffect(() => {
    const fetchPatients = async () => {
      const querySnapshot = await getDocs(collection(db, "prescriptions"));
      const patientsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientsList);
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const searchIn = `${patient.patientName} ${patient.reason_for_visit} ${patient.id}`.toLowerCase();
    return searchIn.includes(searchTerm.toLowerCase());
  });
  

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
   const renderRows = () => {
     if (currentPatients.length === 0) {
       return (
         <tr>
           <td colSpan={columnsPerRow * 2} className="text-center text-muted">
             No data available for the selected consultant and date.
           </td>
         </tr>
       );
     }
 
     const rows = [];
     for (let i = 0; i < currentPatients.length; i += columnsPerRow) {
       const row = (
         <tr key={i}>
           {Array.from({ length: columnsPerRow }).map((_, j) => {
             const patient = currentPatients[i + j];
             return patient ? (
               <React.Fragment key={j}>
                 <td>{patient.patientName} - {patient.reason_for_visit}</td>
                 <td>
                   <input
                     type="checkbox"
                     checked={selectedPatients.some(p => p.id === patient.id)}
                     onChange={() =>
                       handleCheckboxChange({
                        id: patient.id,
                        name: patient.patientName,
                        reason: patient.reason_for_visit,
                       })
                     }
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


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedConsultant || !issueDate || selectedPatients.length === 0) {
      toast.error("Please fill all fields and select patients");
      return;
    }
  
    try {
      const appointmentDate = issueDate.toLocaleDateString("en-CA");
  
      // Create an appointment document for each patient
      const createAppointments = selectedPatients.map(async (patient) => {
        // Generate a unique appointmentId
        const appointmentId = crypto.randomUUID();
  
        // Add to Consultantappointments collection
        const newAppointmentRef = await addDoc(collection(db, "Consultantappointments"), {
          consultantName: selectedConsultant.name,
          consultantId: selectedConsultant.id,
          patientName: patient.name,
          patientId: patient.id,
          appointmentId: appointmentId,
          prescriptionId: patient.id, // Assuming patient.id is the prescription document ID
          reason: patient.reason,
          date: appointmentDate,
          createdAt: new Date(),
        });
  
        // Update the prescription with the consultant info
        const prescriptionRef = doc(db, "prescriptions", patient.id);
        await updateDoc(prescriptionRef, {
          consultants: arrayUnion({
            id: selectedConsultant.id,
            name: selectedConsultant.name,
            date: appointmentDate,
            appointmentId: newAppointmentRef.id,
            checkId:appointmentId, // You can use this or the generated one
          })
        });
      });
  
      await Promise.all(createAppointments);
  
      toast.success("Appointments created successfully for all selected patients!");
      setSelectedPatients([]);
      setIssueDate(null);
      setSelectedConsultant("");
    } catch (error) {
      console.error("Error during submission: ", error);
      toast.error("Something went wrong while saving.");
    }
  };
      return (
    <div className="App">
        <div className="main-container">
            <div className="xs-pd-20-10 pd-ltr-20">
                <div className="card-box xs-pd-20-10 pd-ltr-20">
                    <form onSubmit={handleSubmit}>
                        <h3>Consultant Booking Appointment Form</h3>
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
                                        required
                                    />
                                </div>
                            </div>
                            </div>

                        </div>
                        <div className="row">
                            <div className="Booking-Consultant-PatientTable-Heading" style={{display:"flex",justifyContent:"space-between"}}>
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
                            <table className="table table-bordered text-center mt-3">
                              <thead className="thead-light">
                                <tr>
                                  {Array.from({ length: columnsPerRow }).map((_, i) => (
                                    <React.Fragment key={i}>
                                      <th>Patient - Reason</th>
                                      <th>Select</th>
                                    </React.Fragment>
                                  ))}
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
                        <div className="row" style={{ marginBottom: "50px", display: "flex",justifyItems:"center",alignItems:"center" }}>
                            <div className="col-md-12 text-center" style={{ marginBottom: "50px",}}>
                                <button type="submit" className="btn btn-primary">
                                Submit
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

export default PatientForm;
