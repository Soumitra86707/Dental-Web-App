import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import "./DoctorReschedule.css";
import { db } from "../Config/FirebaseConfig";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // Import navigate


const DoctorReschedule = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotStartTimes, setSlotStartTimes] = useState([]);
  const allSlots = ["10:30", "11:00", "11:30", "12:00", "12:30", "17:00", "17:30", "18:00", "18:30", "19:00"];
  const [newSlot, setNewSlot] = useState(null);
  const moment = require("moment");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const appointmentsCollection = collection(db, "Appointments");
        const appointmentsQuery = query(appointmentsCollection, orderBy("booking_time_stamp", "desc"));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);

        const now = new Date();

        const formattedAppointments = appointmentsSnapshot.docs
          .map((doc) => {
            const appointment = doc.data();
            const appointmentDate = new Date(appointment.appointment_date.replace(/_/g, "-"));

            return {
              id: doc.id,
              date: appointmentDate,
              slot_start_time: appointment.slot_start_time,
              slot_end_time: appointment.slot_end_time,
              patient_name: appointment.patient_name,
              reason_for_visit: appointment.reason_for_visit,
            };
          })
          .filter((appointment) => {
            // Filter logic for future appointments
            if (appointment.date > now) {
              return true;
            } else if (
              appointment.date.toDateString() === now.toDateString() &&
              timeToMinutes(appointment.slot_start_time) >= timeToMinutes(now.toTimeString().slice(0, 5))
            ) {
              return true;
            }
            return false;
          });

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error.message);
      }
    };

    fetchAppointments();
  }, []);

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(new Date());
    setNewSlot(null);
    setAvailableSlots([]);
    setSlotStartTimes([]);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);

    if (date) {
      const formattedDate = formatDateString(date);
      const now = new Date();

      const bookedSlotsForDate = appointments
        .filter((appt) => formatDateString(appt.date) === formattedDate)
        .map((appt) => appt.slot_start_time);

      const freeSlots = allSlots.filter((slot) => {
        if (formatDateString(now) === formattedDate) {
          return !bookedSlotsForDate.includes(slot) && timeToMinutes(slot) >= timeToMinutes(now.toTimeString().slice(0, 5));
        }
        return !bookedSlotsForDate.includes(slot);
      });

      setAvailableSlots(freeSlots);

      const selectedDateAppointments = appointments.filter(
        (appt) => formatDateString(appt.date) === formattedDate
      );

      setSlotStartTimes(selectedDateAppointments.map((appt) => appt.slot_start_time));
      setNewSlot(null);
    }
  };

  const handleSlotSelect = (slot) => {
    setNewSlot(slot);
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !newSlot || !selectedDate) {
      alert("Please select an appointment, a date, and a slot!");
      return;
    }
  
    const slotMap = {
      "10:30": 1, "11:00": 2, "11:30": 3, "12:00": 4, "12:30": 5,
      "17:00": 6, "17:30": 7, "18:00": 8, "18:30": 9, "19:00": 10,
      "19:30": 11, "20:00": 12
    };
  
    const formattedSlot = moment(newSlot, "HH:mm").format("HH:mm");
    const slot_no = slotMap[formattedSlot] || -1; // Default to -1 if not found
  
    const newSlotEndTime = moment(newSlot, "HH:mm").add(30, "minutes").format("HH:mm");
  
    try {
      const appointmentDocRef = doc(db, "Appointments", selectedAppointment.id);
  
      await updateDoc(appointmentDocRef, {
        appointment_date: formatDateString(selectedDate),
        slot_start_time: newSlot,
        slot_end_time: newSlotEndTime,
        slot_no: slot_no,
      });
  
      toast.success("Appointment Successfully Rescheduled! Redirecting...", {
        autoClose: 3200, // 5 seconds
        className: "custom-toast",
        closeOnClick: false,
        draggable: false,
        progress: undefined,
      });
  
      setTimeout(() => {
        navigate("/appointments/RescheduleAppointment"); // Redirect to reschedule page
        window.location.reload(); // Force refresh after navigation
      }, 2000);
    } catch (error) {
      console.error("Error updating appointment:", error.message);
      toast.error(`Failed to update appointment: ${error.message}`);
    }
  };
  

  function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}_${month}_${day}`;
  }

  function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  const now = new Date();

  const todayAppointments = appointments
  .filter(
    (appt) =>
      formatDateString(appt.date) === formatDateString(now) &&
      timeToMinutes(appt.slot_start_time) >= timeToMinutes(now.toTimeString().slice(0, 5))
  )
  .sort((a, b) => timeToMinutes(a.slot_start_time) - timeToMinutes(b.slot_start_time));

const upcomingAppointments = appointments
  .filter((appt) => formatDateString(appt.date) > formatDateString(now))
  .sort((a, b) => timeToMinutes(a.slot_start_time) - timeToMinutes(b.slot_start_time));

  return (
<div className="App">
    <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20" style={{ padding: "10px", backgroundColor: "#FFF7DE" }}>
            <div className="card-box pb-10" style={{ padding: "10px", backgroundColor: "#FFF7DE", color: "#4B4B4B" }}>
                <div className="row">
                    {/* Appointment list */}
                    <div className={selectedAppointment ? "col-md-6 col-sm-12" : "col-md-12 col-sm-12"}>
                        <h2>Reschedule Appointments</h2>
                        <div className="appointments-list">
                            <h3>Today's Appointments</h3>
                            <div className="appointments-grid">
                              {todayAppointments.length > 0 ? (
                                  todayAppointments.map((appointment) => (
                                      <button
                                          key={appointment.id}
                                          className={`appointment ${selectedAppointment?.id === appointment.id ? "selected" : ""}`}
                                          onClick={() => handleAppointmentSelect(appointment)}
                                      >
                                          {`${appointment.patient_name} | ${appointment.reason_for_visit} | ${appointment.slot_start_time} - ${appointment.slot_end_time} | ${appointment.date.toDateString()}`}
                                      </button>
                                  ))
                              ) : (
                                  <p style={{ textAlign: "center", fontSize: "16px", color: "gray", marginTop: "10px" }}>
                                      No appointments available
                                  </p>
                              )}
                            </div>

                        </div>

                        <div className="appointments-list">
                            <h3>Upcoming Appointments</h3>
                            <div className="appointments-grid">
                              {upcomingAppointments.length > 0 ? (
                                  upcomingAppointments.map((appointment) => (
                                      <button
                                          key={appointment.id}
                                          className={`appointment ${selectedAppointment?.id === appointment.id ? "selected" : ""}`}
                                          onClick={() => handleAppointmentSelect(appointment)}
                                      >
                                          {`${appointment.patient_name} | ${appointment.reason_for_visit} | ${appointment.slot_start_time} - ${appointment.slot_end_time} | ${appointment.date.toDateString()}`}
                                      </button>
                                  ))
                              ) : (
                                  <p style={{ textAlign: "center", fontSize: "16px", color: "gray", marginTop: "10px" }}>
                                      No appointments available
                                  </p>
                              )}
                            </div>
                        </div>
                    </div>

                    {/* Calendar and slots appear in the right section */}
                    {selectedAppointment && (
                        <div className="col-md-6 col-sm-12">
                            <h3>Select New Date</h3>
                            <div className="calendar-container">
                                <Calendar onChange={handleDateChange} value={selectedDate} minDate={new Date()} />
                            </div>

                            {/* Slots appear below the calendar */}
                            {selectedDate && (
                                <div className="slots-container" style={{ marginTop: "20px" }}>
                                    <h3>Available Slots on {selectedDate.toDateString()}</h3>
                                    {availableSlots.length > 0 ? (
                                        <div className="slots">
                                            {availableSlots.map((slot, index) => (
                                                <button
                                                    key={index}
                                                    className={`slot ${newSlot === slot ? "selected" : ""}`}
                                                    onClick={() => handleSlotSelect(slot)}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No slots available for this date.</p>
                                    )}
                                </div>
                            )}

                            {/* Confirm Reschedule button appears below slots */}
                            {newSlot && (
                                <div className="reschedule-btn-container" style={{ marginTop: "20px" }}>
                                    <button
                                        className="submit-btn"
                                        onClick={handleReschedule}
                                        disabled={!selectedAppointment || !newSlot || !selectedDate}
                                    >
                                        Confirm Reschedule
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
</div>


  );
};

export default DoctorReschedule;
