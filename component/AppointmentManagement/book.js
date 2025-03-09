import { useState,useEffect } from "react";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Book.css";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../Config/FirebaseConfig";
import moment from "moment-timezone";

function BookAppointment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [bloodTransfusion, setBloodTransfusion] = useState("");
  const [transfusionDate, setTransfusionDate] = useState("");
  const conditions = [
    "Anemia", "Arthritis, Rheumatism", "Artificial Heart Valves", "Asthma",
    "Back problems", "Cancer", "Chemical Dependency", "Chemotherapy",
    "Artificial Joints", "Blood Disease", "Cortisone Treatment", "Persistent Cough",
    "Cough up Blood", "Diabetes", "Epilepsy", "Fainting",
    "Glaucoma", "Headaches", "Heart Problem", "Hemophilia",
    "Hepatitis", "High Blood Pressure", "HIV/AIDS", "Jaw Pain",
    "Kidney Disease", "Liver Disease", "Pacemaker", "Respiratory Disease",
    "Scarlet fever", "Shortness of Breath", "Skin Rash", "Stroke",
    "Swelling of Feet or Ankles", "Thyroid problem", "Tobacco/Pan chewer", "Tonsillitis",
    "Tuberculosis", "Ulcer", "Venereal Disease"
  ];

  const [selectedConditions, setSelectedConditions] = useState([]);

  const handleCheckboxChange1 = (condition) => {
    setSelectedConditions((prevSelected) =>
      prevSelected.includes(condition)
        ? prevSelected.filter((item) => item !== condition)
        : [...prevSelected, condition]
    );
  };
  const issues = [
    "Bad Breath / Bleeding Gums",
    "Clicking Jaw / Jaw Pain",
    "Food Collection between Teeth",
    "Grinding Teeth",
    "Loose Teeth or Broken Fillings",
    "Periodontal Problem",
    "Sharp Tooth",
    "Sensitivity to Hot/Cold/Sweets",
    "Mal-aligned Teeth",
    "Sensitivity when Biting",
    "Sores or Growth in Your Mouth",
  ];

  const handleCheckboxChange = (issue) => {
    setSelectedIssues((prevIssues) =>
      prevIssues.includes(issue)
        ? prevIssues.filter((item) => item !== issue) // Remove if already selected
        : [...prevIssues, issue] // Add if not selected
    );
  };

  const steps = ["Basic Information", "Medical History", "Slot Booking"];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    alert("Form Submitted Successfully!");
  };

  const [date, setDate] = useState(new Date());
  const [slotData, setSlotData] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const allSlots = [
    "10:30", "11:00", "11:30", "12:00", "12:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  const generateAppointmentId = (length = 20) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const formattedDate = moment(date).tz("Asia/Kolkata").format("YYYY_MM_DD");
        const appointmentsQuery = query(
          collection(db, "Patient Appointments"),
          where("appointment_date", "==", formattedDate)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const bookedSlots = appointmentsSnapshot.docs.map((doc) => ({
          slot_start_time: doc.data().slot_start_time,
          slot_no: doc.data().slot_no,
          patient_name: doc.data().patient_name,
        }));
        setSlotData(bookedSlots);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };
    fetchAppointments();
  }, [date]);

  const remainingSlots = allSlots.filter((slot) => {
    const currentTime = moment().tz("Asia/Kolkata");
    const selectedDate = moment(date).tz("Asia/Kolkata");
    const slotTime = moment(slot, "HH:mm").tz("Asia/Kolkata");

    if (slotData.some((s) => s.slot_start_time === slot)) return false;
    if (selectedDate.isSame(currentTime, "day") && slotTime.isBefore(currentTime)) return false;

    return true;
  });

  const handleSlotSelection = (slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSlotBooking = async () => {
    if (selectedSlots.length === 0) {
      alert("Please select at least one slot before submitting.");
      return;
    }

    try {
      const appointmentDate = moment(date).tz("Asia/Kolkata").format("YYYY_MM_DD");
      const patientName = "Dr. Nithya";
      const reason = "Booked by doctor";
      const docId = "wLD2iYoIPIY70WSJfhLl";
      const gender = "Female";
      const bookingTimestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD_HH_mm_ss.ss");

      for (const slot of selectedSlots) {
        const appointmentId = generateAppointmentId();
        const slotStartTime = slot;
        const slotEndTime = moment(slot, "HH:mm").add(30, "minutes").format("HH:mm");
        const patientAccountId = generateAppointmentId();
        const patientId = generateAppointmentId();
        const slotNo = allSlots.indexOf(slotStartTime) + 1;

        await addDoc(collection(db, "Patient Appointments"), {
          appointment_date: appointmentDate,
          slot_start_time: slotStartTime,
          slot_end_time: slotEndTime,
          slot_no: slotNo,
          appointment_id: appointmentId,
          patient_name: patientName,
          reason_for_visit: reason,
          appointment_no: 0,
          doc_id: docId,
          gender: gender,
          booking_time_stamp: bookingTimestamp,
          is_nursing: false,
          is_pregnant: false,
          is_taking_birth_control_pills: false,
          patient_account_id: patientAccountId,
          patient_id: patientId,
          patient_dental_history: ["NA", "NA"],
        });
      }

      alert("Selected slots booked successfully!");
      setSlotData((prev) => [
        ...prev,
        ...selectedSlots.map((slot) => ({
          slot_start_time: slot,
          slot_no: allSlots.indexOf(slot) + 1,
          patient_name: patientName,
        })),
      ]);
      setSelectedSlots([]);
    } catch (error) {
      console.error("Error booking slots:", error);
      alert("Failed to book the slots. Please try again later.");
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
          <div className="p-6 card-box mb-6">
            {/* Steps Indicator */}
            <div className="d-flex justify-content-between align-items-center w-100 position-relative" style={{padding:"40px"}}>
              {steps.map((step, index) => (
                <div key={index} className="d-flex flex-column align-items-center position-relative">
                  {/* Step Circle */}
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle border border-2"
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: currentStep >= index ? "#0d6efd" : "transparent",
                      color: currentStep >= index ? "white" : "#6c757d",
                      borderColor: currentStep >= index ? "#0d6efd" : "#6c757d",
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Step Title */}
                  <h5
                    className="mt-2 text-center w-100 text-sm fw-semibold"
                    style={{ color: currentStep === index ? "#0d6efd" : "#6c757d" }}
                  >
                   {step === "Basic Information" ? (
                        <>
                            {step} & Dental History
                        </>
                        ) : (
                        <>{step}</>
                        )}
                  </h5>

                  {/* Step Connector */}
                  {index < steps.length - 1 && (
                    <div
                      className="position-absolute top-50 start-50 translate-middle"
                      style={{
                        width: "100%",
                        height: "4px",
                        backgroundColor: "black",
                        zIndex: "-1",
                      }}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Forms */}
            <div className="wizard-content p-4  " style={{margin:"10px"}}>
                <form >
              {currentStep === 0 && (
                <section>
                    <hr />
                    <div className="row">
                        <div className="col-md-3 col-sm-12">
                            <div className="form-group">
                            <label>Patients Name</label>
                            <input
                                type="Text"
                                className="form-control"
                                
                                
                            />
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-12">
                            <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="number"
                                className="form-control"
                                
                                
                            />
                            </div>
                        </div>

                        <div className="col-md-3 col-sm-12">
                            <div className="form-group">
                            <label>Age</label>
                            <input
                                type="number"
                                className="form-control"
                                
                                
                            />
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-12">
                            <div className="form-group">
                                <label>Gender</label>
                                <select className="form-control">
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                    </div>
                    <div className="row">
                        <div className="col-md-3 col-sm-12">
                            <div className="form-group">
                            <label>Email</label>
                            <input
                                type="Text"
                                className="form-control"
                                
                                
                            />
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-12">
                                <div className="form-group">
                                    <label>Reason For Visit</label>
                                    <select
                                    className="form-control"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    >
                                    <option value="">Select Reason</option>
                                    <option value="consultation">Consultation</option>
                                    <option value="follow-up">Follow-up</option>
                                    <option value="checkup">Routine Check-up</option>
                                    <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            {/* Custom Input Field (Only shows when "Other" is selected) */}
                                {reason === "other" && (
                                    <div className="col-md-5 col-sm-12">
                                                        <div className="form-group">
                                                <label>Specify Your Reason</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter your reason"
                                                    value={customReason}
                                                    onChange={(e) => setCustomReason(e.target.value)}
                                                />
                                        </div>
                            </div>
                             )}
    


                    </div>
                    <hr />
                    <div className="row">
                    <div className="col-md-12 col-sm-12">
                        <div className="form-group">
                            <label >
                            Select any of the following problems you have or have had:
                            </label>

                            {/* Checkbox List */}
                            <div className="row">
                                {issues.map((issue, index) => (
                                <div key={index} className="col-md-4 col-sm-6">
                                    <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`issue-${index}`}
                                        checked={selectedIssues.includes(issue)}
                                        onChange={() => handleCheckboxChange(issue)}
                                    />
                                    <label className="form-check-label" htmlFor={`issue-${index}`}>
                                        {issue}
                                    </label>
                                    </div>
                                </div>
                                ))}
                        </div>
                        </div>

                        {/* Show Selected Problems (Optional) */}
                        <div className="mt-3">
                            <strong>Selected Issues:</strong> {selectedIssues.length > 0 ? selectedIssues.join(", ") : "None"}
                        </div>
                    </div>
                    </div>
                </section>
              )}

              {currentStep === 1 && (
                <section>
                    <hr />
                  <div className="row">
                        <div className="col-md-5 col-sm-12">
                            <div className="form-group">                       
                                <label >Underwent any Blood Transfusion?</label>
                                <select
                                    className="form-control"
                                    value={bloodTransfusion}
                                    onChange={(e) => {
                                    setBloodTransfusion(e.target.value);
                                    if (e.target.value === "no") {
                                        setTransfusionDate(""); // Clear date if "No" is selected
                                    }
                                    }}
                                >
                                    <option value="">Select an option</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </div>

                                {/* Date Input (Appears Only If "Yes" is Selected) */}
                                {bloodTransfusion === "yes" && (
                                    <div className="col-md-4 col-sm-12">
                                        <div className="form-group"> 
                                            <label className="form-label">If Yes, approximate date:</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={transfusionDate}
                                                onChange={(e) => setTransfusionDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                        

                    </div>
                    <div className="row">
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>Are you Pregnant  ?</label>
                                <select className="form-control">
                                <option value="">Select Option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>Nursing</label>
                                <select className="form-control">
                                <option value="">Select Option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>Taking Birth control Pills?</label>
                                <select className="form-control">
                                <option value="">Select Option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div className="row">
                        <div className="col-md-12 col-sm-12">
                            <div className="form-group">
                                <label >Select any of the following you have or had:</label>
                                    <div className="row">
                                        {conditions.map((condition, index) => (
                                            <div key={index} className="col-md-3 col-sm-6">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`condition-${index}`}
                                                        checked={selectedConditions.includes(condition)}
                                                        onChange={() => handleCheckboxChange1(condition)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`condition-${index}`}>
                                                        {condition}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            </div>
                        </div>
                    </div>
                </section>
              )}

              {currentStep === 2 && (
                <section>
                    <hr />
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                        <h2>Book an Appointment</h2>
                        <div className="calendar-container p-3">
                            <Calendar onChange={setDate} value={date} minDate={new Date()} />
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                    <h3>Available Slots</h3>
                        <div className="slots-container d-flex flex-wrap justify-content-center gap-2">
                            {remainingSlots.length > 0 ? (
                            remainingSlots.map((slot, index) => (
                                <button
                                key={index}
                                className={`btn btn-outline-primary slot-btn ${
                                    selectedSlots.includes(slot) ? "selected" : ""
                                }`}
                                onClick={() => handleSlotSelection(slot)}
                                >
                                {slot}
                                </button>
                            ))
                            ) : (
                            <p>No available slots for this date.</p>
                            )}
                        </div>
                    </div>
                  </div>
                </section>
              )}

              
              </form>
            </div>
            

            {/* Navigation Buttons */}
            <div className="mt-4 d-flex justify-content-between">
              {currentStep > 0 && (
                <button onClick={prevStep} className="btn btn-secondary">
                  Previous
                </button>
              )}
              {currentStep < steps.length - 1 ? (
                <button onClick={nextStep} className="btn btn-primary">
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit} className="btn btn-success">
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookAppointment;
