import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../Config/FirebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";

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
  const [columnsPerRow, setColumnsPerRow] = useState(3);

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
      const consultantsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().fname + " " + doc.data().lname,
      }));
      setConsultants(consultantsList);
    };
    fetchConsultants();
  }, []);

  const handleCheckboxChange = (patient) => {
    setSelectedPatients((prevSelected) => {
      const alreadySelected = prevSelected.find((p) => p.id === patient.id);
      return alreadySelected
        ? prevSelected.filter((p) => p.id !== patient.id)
        : [...prevSelected, patient];
    });
  };

  const handleConsultantChange = async (name) => {
    const selected = consultants.find((c) => c.name === name);
    if (!selected) return;

    setSelectedConsultant(selected);
    setIssueDate(null);

    const docRef = doc(db, "consultants", selected.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.availability && Array.isArray(data.availability)) {
        const numericDays = data.availability.map(
          (day) => weekDayToNumber[day.toLowerCase()]
        );
        setAvailableDays(numericDays);
      }
    }
  };

  const isDayDisabled = (date) => !availableDays.includes(date.getDay());

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedConsultant) return;
      const today = new Date().toLocaleDateString("en-CA");
      const appointmentsQuery = query(
        collection(db, "Consultantappointments"),
        where("consultantId", "==", selectedConsultant.id),
        where("date", ">=", today)
      );
      const querySnapshot = await getDocs(appointmentsQuery);
      const appointments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(appointments);
    };
    fetchAppointments();
  }, [selectedConsultant]);

  const filteredPatients = patients.filter((patient) => {
    const matchSearch = `${patient.patientName} ${patient.reason}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (issueDate) {
      const selectedDate = issueDate.toLocaleDateString("en-CA");
      return matchSearch && patient.date === selectedDate;
    }
    return matchSearch;
  });

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(
    indexOfFirstPatient,
    indexOfLastPatient
  );
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
                <td>{patient.patientName} - {patient.reason}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedPatients.some((p) => p.id === patient.id)}
                    onChange={() =>
                      handleCheckboxChange({
                        id: patient.id,
                        PrescriptionId: patient.prescriptionId,
                        name: patient.patientName,
                        reason: patient.reason,
                        appointmentId: patient.appointmentId,
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

  const handleCancel = async (e) => {
    e.preventDefault();

    if (!selectedConsultant || selectedPatients.length === 0) {
      toast.error("Please fill all fields and select patients");
      return;
    }

    try {
      const cancelPromises = selectedPatients.map(async (patient) => {
        const { PrescriptionId, appointmentId } = patient;
        const prescriptionRef = doc(db, "prescriptions", PrescriptionId);
        const prescriptionSnap = await getDoc(prescriptionRef);

        if (prescriptionSnap.exists()) {
          const data = prescriptionSnap.data();
          const updatedConsultants = (data.consultants || []).filter(
            (c) => c.checkId !== appointmentId
          );
          await updateDoc(prescriptionRef, {
            consultants: updatedConsultants,
          });
        }

        const q = query(
          collection(db, "Consultantappointments"),
          where("appointmentId", "==", appointmentId)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(db, "Consultantappointments", docSnap.id));
        });
      });

      await Promise.all(cancelPromises);
      toast.success("Appointments cancelled successfully!", {
        autoClose: 3000,
        className: "custom-toast",
      });

      setTimeout(() => window.location.reload(), 2000);
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
                <div className="col-md-4 col-sm-12">
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

              <div className="row mt-3">
                <div
                  className="Booking-Consultant-PatientTable-Heading"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <h4>Patients Table</h4>
                  <input
                    type="text"
                    className="form-control"
                    style={{ maxWidth: "250px" }}
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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

                <div className="pagination-controls d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="row mt-4 mb-5 text-center">
                <div className="col-md-12">
                  <button type="submit" className="btn btn-primary">
                    Cancel Appointment
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
