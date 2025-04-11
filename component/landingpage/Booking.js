import { useState,useEffect } from "react";
import "./book1.css";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
/* import FetchSlots from "./Slots"; */
import Calendar from "react-calendar";
import { db } from "../Config/FirebaseConfig"; // Firestore instance
import { collection, query, where, getDocs, addDoc ,setDoc, arrayUnion } from "firebase/firestore";
import moment from "moment-timezone";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function BookAppointment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userAge ,setUserAge] = useState("");
  const [userGender ,setUserGender] = useState("");
  const [userEmail ,setUserEmail] = useState("");
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [matchingPatients, setMatchingPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [userType, setUserType] = useState("patient");
 /*  const [allSlots, setAllSlots] = useState([]); */
  const [date, setDate] = useState(new Date());
  const [slotData, setSlotData] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
/*   const [selectedSlot, setSelectedSlot] = useState(userType === "doctor" ? [] : null); */
  const navigate = useNavigate();
  const allSlots = [
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
  ];
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

  const [medicalHistory, setMedicalHistory] = useState([]);

  const handleCheckboxChange1 = (condition) => {
    setMedicalHistory((prevSelected) =>
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
  const [formData, setFormData] = useState([
    { userType:"" ,patientsPhone: "", patientsName: "",custompatientsName:"", age:"", gender:"" , email: "" , reasonForVisit:"",customReasonForVisit:"",selectedIssues :[] },
    { isBloodTest: "",BloodTestDate: "", isPregnant: "",isNursing: "",isTakingBirthControlPill: "", anyMedications:"" , anyAllergies: "" ,anyOperations: "" ,medicalHistory:[] },
    { appointmentDate: "", slots: [] }
  ]);
  const [currentData, setCurrentData] = useState(formData[0]);
  const handlePatientSelect = async (e) => {
    const value = e.target.value;
    setSelectedPatient(value);
    setCurrentData((prev) => ({ ...prev, patientsName: value }));
  
    if (value !== "other" && value !== "") {
      try {
        // Fetch the latest record of the selected patient
        const patientQuery = query(
          patientsCollection,
          where("patient_name", "==", value), // Directly filter by patient name
          where("patient_phone_number", "==", currentData.patientsPhone)
        );
  
        const querySnapshot = await getDocs(patientQuery);
        const filteredPatients = querySnapshot.docs
          .map((doc) => doc.data())
          .sort((a, b) => b.modified_on - a.modified_on); // Sort by modified_on (newest first)
  
        if (filteredPatients.length > 0) {
          const latestRecord = filteredPatients[0]; // Get the most recent record
  
          // Update formData state
          const newFormData = [
            {
              userType: "patient",
              patientsPhone: latestRecord.patient_phone_number,
              patientsName: latestRecord.patient_name,
              custompatientsName: "",
              age: latestRecord.age,
              gender: latestRecord.gender,
              email: latestRecord.email || "",
              reasonForVisit: "",
              customReasonForVisit: "",
              selectedIssues: latestRecord.patient_dental_history || [],
            },
            {
              isBloodTest: latestRecord.has_patient_underwent_blood_transfusion || "",
              BloodTestDate: latestRecord.patient_blood_transfusion_date || "",
              isPregnant: latestRecord.is_pregnant || "",
              isNursing: latestRecord.is_nursing || "",
              isTakingBirthControlPill: latestRecord.is_taking_birth_control_pills || "",
              anyMedications: latestRecord.patient_medications || "",
              anyAllergies: latestRecord.patient_allergies || "",
              anyOperations: latestRecord.patient_extra_illnesses || "",
              medicalHistory: latestRecord.patient_medical_history || [],
            },
            {
              appointmentDate: "",
              slots: [],
            },
          ];
  
          setFormData(newFormData);
          setUserEmail(latestRecord.email);
          setUserAge(latestRecord.age );
          setUserGender(latestRecord.gender );
          setSelectedIssues(latestRecord.patient_dental_history || []);
          setMedicalHistory(latestRecord.patient_medical_history || []);
  

        } else {
          console.log("No patient records found.");
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    }
  };
  useEffect(() => {
    
  }, [userGender]); // This will log whenever userGender changes
  


const handleCustomPatientName = (e) => {
  
  setCurrentData({ ...currentData, custompatientsName: e.target.value })

};
const patientsCollection = collection(db, "Patient");

const handlePhoneChange = async (e) => {
  const patientsPhone = e.target.value.replace(/\D/g, "").slice(0, 10); // Allow only numbers, max 10 digits
  setCurrentData({ ...currentData, patientsPhone });

  if (patientsPhone.length === 10) {
    const patientQuery = query(patientsCollection, where("patient_phone_number", "==", patientsPhone));
    const querySnapshot = await getDocs(patientQuery);

    if (!querySnapshot.empty) {
      const patientNames = [];
      querySnapshot.forEach((doc) => {
        patientNames.push(doc.data().patient_name);
      });

      setMatchingPatients(patientNames);
      setSelectedPatient(""); // Reset selection
    } else {
      setMatchingPatients([]);
      setSelectedPatient("");
    }
  } else {
    setMatchingPatients([]);
    setSelectedPatient("");
  }
};

  const handleCheckboxChange = (issue) => {
    setSelectedIssues((prevIssues) =>
      prevIssues.includes(issue)
        ? prevIssues.filter((item) => item !== issue) // Remove if already selected
        : [...prevIssues, issue] // Add if not selected
    );
  };

  const steps = [ "Slot Booking", "Basic Information", "Medical History"];

  const nextStep = () => {
    let newData = [...formData];
    newData[currentStep] = currentData;
    setFormData(newData);
    if (currentStep < formData.length - 1) {
      setCurrentData(newData[currentStep + 1]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentData(formData[currentStep - 1]);
      setCurrentStep(currentStep - 1);
    }
  };
  const generatePatientId = (phoneNumber, name) => {
    if (!phoneNumber || !name) return ""; // Check if both values are provided
  
    const firstFour = phoneNumber.slice(0, 4); // First 2 digits of phone number
    //const lastTwo = phoneNumber.slice(-2); // Last 2 digits of phone number
    const namePart = name.slice(0, 3).toUpperCase(); // First 3 letters of name in uppercase
  
    return `${namePart}${firstFour}`; // Combine all parts
  };

/*   const handleSubmit = () => {
    alert("Form Submitted Successfully!");
  }; */
  const handleSubmit = async () => {




  
    try {
      const appointment_date = moment(date).tz("Asia/Kolkata").format("YYYY_MM_DD");
  
      
      let patientsPhone = formData[0].patientsPhone;
      let patientsName = formData[0].patientsName === "other" ? formData[0].custompatientsName : formData[0].patientsName;
      const reasonForVisit = 
      formData[0].reasonForVisit === "other" && formData[0].customReasonForVisit?.trim() 
        ? formData[0].customReasonForVisit.trim() 
        : formData[0].reasonForVisit || "";
      // Loop through each selected slot and push data to Firestore
        if (!selectedSlots || selectedSlots.length === 0) 
          {
            alert("Please select at least one slot!");
            return;
          }
/*           if (!patientsPhone) {
            alert("Please Select Phone Number!");
            return;
        }
        
        if (patientsPhone.length !== 10 || isNaN(patientsPhone)) {
            alert("Phone number must be exactly 10 digits!");
            return;
        }
        if(!patientsName )
          {
            alert("Please Select or Write Patients name !");
            return;
          }
          if(!reasonForVisit)
            {
              alert("Please Select Reason For Visit!");
              return;
            } */
        const slotStartTime = moment(selectedSlots[0], "HH:mm").tz("Asia/Kolkata");
        const slotEndTime = slotStartTime.clone().add(30, "minutes").format("HH:mm"); // Add 30 min
        let slot_no = 0; // Default slot number
        if (slotStartTime.format("HH:mm") === "10:30") {
          slot_no = 1;
        } else if (slotStartTime.format("HH:mm") === "11:00") {
          slot_no = 2;
        } else if (slotStartTime.format("HH:mm") === "11:30") {
          slot_no = 3;
        } else if (slotStartTime.format("HH:mm") === "12:00") {
          slot_no = 4;
        } else if (slotStartTime.format("HH:mm") === "12:30") {
          slot_no = 5;
        } else if (slotStartTime.format("HH:mm") === "17:00") {
          slot_no = 6;
        } else if (slotStartTime.format("HH:mm") === "17:30") {
          slot_no = 7;
        } else if (slotStartTime.format("HH:mm") === "18:00") {
          slot_no = 8;
        } else if (slotStartTime.format("HH:mm") === "18:30") {
          slot_no = 9;
        } else if (slotStartTime.format("HH:mm") === "19:00") {
          slot_no = 10;
        } else if (slotStartTime.format("HH:mm") === "19:30") {
          slot_no = 11;
        } else if (slotStartTime.format("HH:mm") === "20:00") {
          slot_no = 12;
        } else {
          slot_no = -1; // Invalid slot time
        }
        const appointmentId = generateAppointmentId();
        const bookingTimestamp = moment()
        .tz("Asia/Kolkata")
        .format("YYYY_MM_DD_HH_mm_ss.ss");
        let patientId = ""; // Declare globally
        
        // Ensure the value of patientsName is set before generating patientId
        if (patientsName) {
            patientId = generatePatientId(patientsPhone, patientsName);
        }
        

    let AppointmentData;

    if (userType === "doctor") {
        AppointmentData = {
            userType,
            appointment_date,
            appointment_id: appointmentId,
            booking_time_stamp: new Date().toISOString(),
            doc_id: "Dr. Nithya",
            gender: "N/A",
            is_nursing: false,
            is_pregnant: false,
            is_taking_birth_control_pills: false,
            patient_account_id: "0000000000",
            patient_dental_history: [],
            patient_id: "Dr. Nithya",
            patient_name: "Dr. Nithya",
            age: "N/A",
            reason_for_visit: "Personal Reason",
            slot_no,
            slot_start_time: slotStartTime.format("HH:mm"),
            slot_end_time: slotEndTime
        };
    } else {
      if (!patientsPhone) {
        alert("Please Select Phone Number!");
        return;
    }
    
    if (patientsPhone.length !== 10 || isNaN(patientsPhone)) {
        alert("Phone number must be exactly 10 digits!");
        return;
    }
    if(!patientsName )
      {
        alert("Please Select or Write Patients name !");
        return;
      }
      if(!reasonForVisit)
        {
          alert("Please Select Reason For Visit!");
          return;
        }
        AppointmentData = {
            userType,
            appointment_date,
            appointment_id: appointmentId,
            booking_time_stamp: bookingTimestamp,
            doc_id: "Dr. Nithya",
            gender: userGender,
            is_nursing: formData[1].isNursing,
            is_pregnant: formData[1].isPregnant,
            is_taking_birth_control_pills: formData[1].isTakingBirthControlPill,
            patient_account_id: patientsPhone,
            patient_dental_history: selectedIssues,
            patient_id: patientId,
            patient_name: patientsName,
            age: userAge,
            reason_for_visit: reasonForVisit,
            slot_no,
            slot_start_time: slotStartTime.format("HH:mm"),
            slot_end_time: slotEndTime
        };
    }
    
  
        
        // Save to Firestore (each slot as a separate entry)
        /* await addDoc(collection(db, "Appointments"), AppointmentData); */
        const patientsCollection = collection(db, "Patient");
        const appointmentsCollection = collection(db, "Appointments");

        // Function to check if patient exists
        const patientQuery = query(
          patientsCollection,
          where("patient_id", "==", patientId),
          where("patient_name", "==", patientsName)
          
        );
        const patientSnapshot = await getDocs(patientQuery);

        if (userType === "patient") {
          if (!patientSnapshot.empty) {
              // Patient exists, update data
              const patientDocRef = patientSnapshot.docs[0].ref;
              const updatedData = {
                  modified_on: bookingTimestamp,
                  patient_extra_illnesses: formData[1].anyOperations,
                  is_nursing: formData[1].isNursing,
                  is_pregnant: formData[1].isPregnant,
                  is_taking_birth_control_pills: formData[1].isTakingBirthControlPill,
                  patient_dental_history: selectedIssues,
                  has_patient_underwent_blood_transfusion: formData[1].isBloodTest,
                  patient_allergies: formData[1].anyAllergies,
                  patient_medications: formData[1].anyMedications,
                  patient_blood_transfusion_date: formData[1].BloodTestDate,
                  patient_medical_history: medicalHistory,
                  email: userEmail,
                  appointmentId: arrayUnion(appointmentId),
                  age: userAge,
                  gender: userGender,
                  reason_for_visit: arrayUnion(reasonForVisit),
              };
      
              await setDoc(patientDocRef, updatedData, { merge: true });
      

          } else {
              // Add new patient
              const newPatientData = {
                  appointmentId: arrayUnion(appointmentId),
                  createdAt: bookingTimestamp,
                  modified_on: bookingTimestamp,
                  patient_extra_illnesses: formData[1].anyOperations,
                  doc_id: "dr. Nithya",
                  has_patient_underwent_blood_transfusion: formData[1].isBloodTest,
                  patient_allergies: formData[1].anyAllergies,
                  is_nursing: formData[1].isNursing,
                  is_pregnant: formData[1].isPregnant,
                  is_taking_birth_control_pills: formData[1].isTakingBirthControlPill,
                  patient_dental_history: selectedIssues,
                  patient_medications: formData[1].anyMedications,
                  patient_blood_transfusion_date: formData[1].BloodTestDate,
                  patient_medical_history: medicalHistory,
                  patient_name: patientsName,
                  age: userAge,
                  email: userEmail,
                  gender: userGender,
                  patient_account_id: formData[0].patientsPhone,
                  patient_phone_number: patientsPhone,
                  reason_for_visit: arrayUnion(reasonForVisit),
                  patient_id: patientId,
              };
      
              await addDoc(patientsCollection, newPatientData);
      
             
          }
      }
      

        // Save appointment data
        await addDoc(appointmentsCollection, AppointmentData);

  
        toast.success("Appointment Successfully Booked! Redirecting...", {
          autoClose: 3000, // 10 seconds
          className: "custom-toast",
          closeOnClick: false,
          draggable: false,
          progress: undefined,
        });
    
        // Redirect to dashboard after 10 seconds
        setTimeout(() => {
          navigate(0);
        }, 2000);
  
      // Reset form and slot selection
      setFormData({
        patientsPhone: "",
        patientsName: "",
        custompatientsName: "",
        age: "",
        gender: "",
        email: "",
        reasonForVisit: "",
        customReasonForVisit: "",
        selectedIssues: [],
        isBloodTest: "",
        BloodTestDate: "",
        isPregnant: "",
        isNursing: "",
        isTakingBirthControlPill: "",
        medicalHistory: [],
        appointmentDate: "",
        slots: [],
      });
      setUserAge("");
      setUserEmail("");
      setUserGender("");
      
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };
  const generateAppointmentId = (length = 20) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const formattedDate = moment(date)
          .tz("Asia/Kolkata")
          .format("YYYY_MM_DD");
        const appointmentsQuery = query(
          collection(db, "Appointments"),
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

    // Exclude booked slots
    if (slotData.some((s) => s.slot_start_time === slot)) return false;

    // Exclude past slots for today
    if (selectedDate.isSame(currentTime, "day") && slotTime.isBefore(currentTime)) {
      return false;
    }

    return true;
  });

  const handleSlotSelection = (slot) => {
    setSelectedSlots([slot]); // Always replace with the selected slot (only one allowed)
  };
  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    setFormData((prevFormData) => {
      const updatedFormData = [...prevFormData];
      updatedFormData[2] = { ...updatedFormData[2], appointmentDate: selectedDate.toISOString().split('T')[0] }; // Store as YYYY-MM-DD
      return updatedFormData;
    });
  };


  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20" style={{ padding: "10px",backgroundColor:"#FFF7DE" , color:"#4B4B4B"}}>
          <div className="p-6 card-box mb-6" style={{ padding: "10px",backgroundColor:"#FFF7DE" , color:"#4B4B4B"}}>
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
                            {step} 
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
            <div className="wizard-content p-4  " >
                <form >
                {currentStep === 0 && (
                    <section>
                    <hr />
                    <div className="row">
                      <div className="col-md-6 col-sm-12">
                        <div className="calendar-container" style={{ paddingTop: "60px" }}>
                        <Calendar onChange={handleDateChange} value={date} minDate={new Date()} />
                        </div>
                      </div>
                      <div className="col-md-6 col-sm-12">
                        <h3>Available Slots</h3>
                        <div className="slots">
                          {remainingSlots.length > 0 ? (
                            remainingSlots.map((slot, index) => (
                              <button
                                type="button"
                                key={index}
                                className={`slot ${selectedSlots.includes(slot) ? "selected" : ""}`}
                                onClick={() => handleSlotSelection(slot)}
                              >
                                {slot}
                              </button>
                            ))
                          ) : (
                            <p style={{ marginLeft: "270px", width: "250px" }}>No available slots for this date.</p>
                          )}
                        </div>
                      </div>
                    </div>
                </section>
                )}
              {currentStep === 1 && (
                <section>
                    <hr />
                    <div className="row">
                      <div className="col-md-3 col-sm-12">
                        <div className="form-group">
                          <label>Booking Appointment :</label>
                            <select className="form-control"  value={userType} onChange={(e) => setUserType(e.target.value)}>
                              <option value="doctor">Doctor</option>
                              <option value="patient">Patient</option>
                            </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                    <div className="col-md-3 col-sm-12">
    <div className="form-group">
      <label>Phone Number</label>
      <input
        type="text"
        className="form-control"
        placeholder="Enter Patient's Phone Number"
        inputMode="numeric"
        maxLength="10"
        value={currentData.patientsPhone}
        onInput={(e) => {
          e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
        }}
        onChange={handlePhoneChange}
        disabled={userType === "doctor"}
      />
    </div>
  </div>

{/*   {matchingPatients.length > 0 ? ( */}
    <div className="col-md-3 col-sm-12">
      <div className="form-group">
        <label>Patients Name</label>
        <select
          className="form-control"
          value={selectedPatient}
          onChange={handlePatientSelect}
          disabled={userType === "doctor"}
        >
          <option value="">Select a Patient</option>
          {matchingPatients.map((name, index) => (
            <option key={index} value={name}>
              {name}
            </option>
          ))}
          <option value="other">Other</option>
        </select>
      </div>
    </div>
{/*   ) : (
    <div className="col-md-3 col-sm-12">
      <div className="form-group">
        <label>Patient Name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter Patient Name"
          value={currentData.custompatientsName}
          onChange={handleCustomPatientName}
          disabled={userType === "doctor"}
        />
      </div>
    </div>
  )} */}

  {selectedPatient === "other" && (
    <div className="col-md-3 col-sm-12">
      <div className="form-group">
        <label>Patient Name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter Patient Name"
          value={currentData.custompatientsName}
          onChange={handleCustomPatientName}
          disabled={userType === "doctor"}
        />
      </div>
    </div>
  )}
                          <div className="col-md-3 col-sm-12">
                            <div className="form-group">
                              <label>Age</label>
                              <input
                                  type="text"
                                  className="form-control"
                                  value={userAge}
                                  onChange={(e) => {
                                    const newAge = e.target.value;
                                    
                                    setUserAge(newAge);
                                   

                                  }}  disabled={userType === "doctor"}
                              />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                      <div className="col-md-3 col-sm-12">
                          <div className="form-group">
                            <label>Gender</label>
                            <select 
                              className="form-control" 
                              value={userGender}  // Should use userGender, not userEmail
                              onChange={(e) => {
                                setUserGender(e.target.value); // Correct state update
                              }}
                              disabled={userType === "doctor"}
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      <div className="col-md-3 col-sm-12">
                        <div className="form-group">
                          <label>Email</label>
                          <input
                                type="Text"
                                className="form-control"
                                value={userEmail}
                                onChange={(e) => {
                                  const newEmail = e.target.value;
                                  
                                  setUserEmail(newEmail);
                                  

                                }}
                                disabled={userType === "doctor"}
                          />
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-12">
                        <div className="form-group">
                          <label>Reason For Visit</label>
                          <select
                            className="form-control"
                            value={currentData.reasonForVisit}
                            onChange={(e) => setCurrentData({ ...currentData, reasonForVisit: e.target.value })}
                            disabled={userType === "doctor"}
                          >
                            <option value="">Select Reason</option>
                            <option value="consultation">Consultation</option>
                            <option value="follow-up">Follow-up</option>
                            <option value="checkup">Routine Check-up</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        </div>
                        {currentData.reasonForVisit === "other" && (
                          <div className="col-md-3 col-sm-12">
                            <div className="form-group">
                              <label>Specify Your Reason</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter your reason"
                                value={currentData.customReasonForVisit}
                                onChange={(e) => setCurrentData({ ...currentData, customReasonForVisit: e.target.value })}
                                disabled={userType === "doctor"}
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
                                        disabled={userType === "doctor"}
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

              {currentStep === 2 && (
                <section>
                    <hr />
                  <div className="row">
                        <div className="col-md-5 col-sm-12">
                          <div className="form-group">
                            <label>Underwent any Blood Transfusion?</label>
                            <select
                              className="form-control"
                              value={currentData.isBloodTest}
                              onChange={(e) => setCurrentData({ ...currentData, isBloodTest: e.target.value})}
                              disabled={userType === "doctor"}
                            >
                              <option value="">Select an option</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                          {currentData.isBloodTest === "yes" && (
                            <div className="col-md-5 col-sm-12">
                              <div className="form-group">
                                <label>If Yes, approximate date:</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={currentData.BloodTestDate}
                                  onChange={(e) => setCurrentData({ ...currentData, BloodTestDate: e.target.value })}
                                />
                              </div>
                            </div>
                          )}
                        

                    </div>
                    <div className="row">
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>Are you Pregnant  ?</label>
                                <select className="form-control" 
                                value={currentData.isPregnant} 
                                onChange={(e) => setCurrentData({ ...currentData, isPregnant: e.target.value })}
                                disabled={userType === "doctor"} >
                                <option value="">Select Option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>Nursing</label>
                                <select className="form-control"
                                value={currentData.isNursing} 
                                onChange={(e) => setCurrentData({ ...currentData, isNursing: e.target.value })}
                                disabled={userType === "doctor"}
                                >
                                <option value="">Select Option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>Taking Birth control Pills?</label>
                                <select className="form-control"
                                value={currentData.isTakingBirthControlPill} 
                                onChange={(e) => setCurrentData({ ...currentData, isTakingBirthControlPill: e.target.value })}
                                disabled={userType === "doctor"}
                                >
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
                                                        checked={medicalHistory.includes(condition)}
                                                        onChange={() => handleCheckboxChange1(condition)}
                                                        disabled={userType === "doctor"}
                                                    />
                                                    <label className="form-check-label" htmlFor={`condition-${index}`}>
                                                        {condition}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                            <strong>Selected Issues:</strong> {medicalHistory.length > 0 ? medicalHistory.join(", ") : "None"}
                        </div>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div className="row">
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>List any other Serious Illnesses or Operation that you have or Had
                                </label>
                                <input
                                    type="Text"
                                    className="form-control"
                                    value={currentData.anyOperations} 
                                    onChange={(e) => setCurrentData({ ...currentData, anyOperations: e.target.value })}
                                    disabled={userType === "doctor"}
                                />
                            </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>List any Current Medications <br /> <p></p></label>
                                <input
                                    type="Text"
                                    className="form-control"
                                    value={currentData.anyMedications} 
                                    onChange={(e) => setCurrentData({ ...currentData, anyMedications: e.target.value })}
                                    disabled={userType === "doctor"}
                                />
                            </div>
                        </div>
                        <div className="col-md-4 col-sm-12">
                            <div className="form-group">
                                <label>List any Allergies <br /> <p></p></label>
                                <input
                                    type="Text"
                                    className="form-control"
                                    value={currentData.anyAllergies} 
                                    onChange={(e) => setCurrentData({ ...currentData, anyAllergies: e.target.value })}
                                    disabled={userType === "doctor"}
                                />
                            </div>
                        </div>
                    </div>
                </section>
              )}

              

              
              </form>
            </div>
            

            {/* Navigation Buttons */}
            <div className="row">
                    <div className="col-md-6 col-sm-12">
                        
                    </div>
                    <div className="col-md-6 col-sm-12" style={{display:"flex" , gap:"20px", alignItems:"center", justifyContent: "flex-end",paddingRight:"50px",}}>
                      
                        {currentStep > 0 && (
                          <button onClick={prevStep} className="btn btn-secondary" style={{padding:"10px 30px"}}>
                            Previous
                          </button>
                        )}
                        {currentStep < steps.length - 1 ? (
                          <button onClick={nextStep} className="btn btn-primary" style={{padding:"10px 30px"}}>
                            Next
                          </button>
                        ) : (
                          <button onClick={handleSubmit} className="btn btn-success" style={{padding:"10px 30px"}}>
                            Submit
                          </button>
                        )}
                      
                    </div>
                    
                  </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookAppointment;
