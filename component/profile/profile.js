import { useEffect, useState , useRef } from "react";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import { db, storage } from "../Config/FirebaseConfig";
import { FaFileCsv, FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";
import React from "react";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from "docx";
import { collection, query, orderBy, getDocs,doc,setDoc,updateDoc ,getDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { FaDownload } from "react-icons/fa";
import Cropper from "cropperjs";
import 'bootstrap/dist/css/bootstrap.min.css';
import myIcon from "../../d2.ico";
import bcrypt from "bcryptjs";



function Profile() {
    const [activeTab, setActiveTab] = useState("settings"); // Default active tab
    
    const [showForm, setShowForm] = useState(false); // Controls form visibility
    const [file, setFile] = useState(null);
    const [fileName1, setFileName1] = useState(null);
    const [oldImageUrl, setOldImageUrl] = useState(null);
    const imageRef = useRef(null);
    const profileImageRef = useRef(null);
    const [cropper, setCropper] = useState(null);
/*     const [croppedImage, setCroppedImage] = useState("../../vendors/images/photo1.jpg");
 */    const [passwordChange, setPasswordChange] = useState(null);
    const [profileData1, setProfileData1] = useState({
        fullName: "",
        email: "",
        dob: "",
        gender: "",
        country: "",
        state: "",
        postalCode: "",
        phone: "",
        address: "",
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        password:""
    });
    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "",
        dob: "",
        gender: "",
        country: "",
        state: "",
        postalCode: "",
        phone: "",
        address: "",
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        password:""
    });
    useEffect(() => {
        const fetchProfileData = async () => {
          try {
            const userId = "1234"; // Replace with the actual logged-in user ID
            const docRef = doc(db, "profile", userId); // Fetch from 'profiles' collection
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
              setProfileData1(docSnap.data());
              setProfileData(docSnap.data());
              setFileName1(docSnap.data().profilePictureName || "");
              setOldImageUrl(docSnap.data().profilePicture || "");
              
            } else {
              console.log("No profile found!");
            }
          } catch (error) {
            console.error("Error fetching profile data:", error);
          }
        };
    
        fetchProfileData();
      }, []);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({
            ...prev,
            [name]: value
        }));
    };
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFile(file);
        
      };
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try { 
                let fileName;
                let imageUrl;
                if(file){
                fileName = `${Date.now()}_${file.name}`;
                
                const imageRef = ref(storage, `Profile/${fileName}`);
        
                // Upload new profile picture
                await uploadBytes(imageRef, file);
                imageUrl = await getDownloadURL(imageRef); 
                
                // Delete old profile picture if it exists
                if (oldImageUrl) {
                    try {
                        const oldImageRef = ref(storage, oldImageUrl);
                        await deleteObject(oldImageRef);
                    } catch (deleteError) {
                        console.warn("Old image deletion failed:", deleteError);
                    }
                }
            }else{
                fileName =fileName1;
                imageUrl = oldImageUrl;
            }
        
                // Update Firestore with the new image URL and file name
                const updatedProfileData = profileData ? { ...profileData } : {};

                // Update Firestore with the new image URL and file name
                const profileRef = doc(db, "profile", "1234");
                await updateDoc(profileRef, {
                    ...updatedProfileData,
                    profilePicture: imageUrl, // Store the image URL
                    profilePictureName: fileName, // Store the file name
                });
        
               
                window.location.reload(); 
        } catch (error) {  
            console.error("Error updating profile data:", error);  
        }
    };

    const handleChangePassword = async () => {  
        try {  
            const hashedPassword = await bcrypt.hash(passwordChange, 10);
            const profileRef = doc(db, "profile", "1234");  
    
            await updateDoc(profileRef,{ password: hashedPassword });

        } catch (error) {  
            console.error("Error updating password change status:", error);  
        }  
    }; 
    
  
    useEffect(() => {
      const handleShow = () => {
        if (imageRef.current) {
          const newCropper = new Cropper(imageRef.current, {
            autoCropArea: 0.8,
            aspectRatio: 1, // Square Crop
            viewMode: 1,
            guides: false,
            center: false,
            highlight: false,
            cropBoxMovable: false,
            cropBoxResizable: false,
            toggleDragModeOnDblclick: false,
          });
          setCropper(newCropper);
        }
      };
  
      const handleHide = () => {
        if (cropper) {
          cropper.destroy();
          setCropper(null);
        }
      };
  
      const modalElement = document.getElementById("modal");
      if (modalElement) {
        modalElement.addEventListener("shown.bs.modal", handleShow);
        modalElement.addEventListener("hidden.bs.modal", handleHide);
      }
  
      return () => {
        if (modalElement) {
          modalElement.removeEventListener("shown.bs.modal", handleShow);
          modalElement.removeEventListener("hidden.bs.modal", handleHide);
        }
      };
    }, [cropper]);
  
    const handleUpdate = () => {
      if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        if (canvas) {
          const croppedImageUrl = canvas.toDataURL(); // Get cropped image as a Data URL
          /* setCroppedImage(croppedImageUrl); */ // Update profile picture
          profileImageRef.current.src = croppedImageUrl; // Set directly
        }
        // Close the modal
        const modalElement = document.getElementById("modal");
        if (modalElement) {
          const bootstrapModal = new window.bootstrap.Modal(modalElement);
          bootstrapModal.hide();
        }
      }
    };

  
/*     const handleUpdatePicture = () => {
      // Here you can add cropping functionality if needed
      const newImageSrc = imageRef.current.src; // Assume the new image is set
      setCroppedImage(newImageSrc);
    }; */
  return (
    <div className="main-container">
        <div className="pd-ltr-20 xs-pd-20-10">
                <div className="min-height-200px">
                    
                    <div className="row">
                        <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 mb-30">
                            <div className="pd-20 card-box height-100-p">
                            <div className="profile-photo">
                                {/* Edit Avatar Button */}
                                {/* <a href="#" data-bs-toggle="modal" data-bs-target="#modal" className="edit-avatar">
                                    <i className="fa fa-pencil"></i>
                                </a> */}

                                {/* Profile Photo */}
                                <img ref={profileImageRef} src={oldImageUrl} alt="Profile" className="avatar-photo" style={{height:"150px",width:"150px", borderRadius:100}} />

                                {/* Bootstrap Modal */}
                                {/* <div className="modal fade" id="modal" tabIndex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                                    <div className="modal-dialog modal-dialog-centered" role="document">
                                        <div className="modal-content">
                                            <div className="modal-body pd-5">
                                                <div className="img-container">
                                                    <img ref={imageRef} id="image" src="vendors/images/photo2.jpg" alt="To Crop" />
                                                </div>
                                            </div>
                                            <div className="modal-footer">
                                                <button onClick={handleUpdatePicture} className="btn btn-primary" data-bs-dismiss="modal">
                                                    Update
                                                </button>
                                                <button type="button" className="btn btn-default" data-bs-dismiss="modal">
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div> */}
                                </div>
                                <h5 className="text-center h5 mb-0">{profileData1.fullName}</h5>
                                {/* <p className="text-center text-muted font-14">
                                    Lorem ipsum dolor sit amet
                                </p> */}
                                <div className="profile-info" >
                                    <h5 className="mb-20 h5 text-blue">Contact Information</h5>
                                    <ul>
                                        <li>
                                            <span>Email Address: {profileData1.email}</span>
                                            
                                        </li>
                                        <li>
                                            <span>Phone Number: {profileData1.phone}</span>
                                            
                                        </li>
                                        <li>
                                            <span>Country: {profileData1.country}</span>
                                            
                                        </li>
                                        <li>
                                            <span>Address: {profileData1.address}</span>
                                            
                                        </li>
                                    </ul>
                                </div>
                                <div className="profile-social">
                                    <h5 className="mb-20 h5 text-primary">Social Links</h5>
                                    <ul className="clearfix">
                                        <li>
                                            <a
                                                href={profileData.facebook}
                                                className="btn"
                                                data-bgcolor="#3b5998"
                                                data-color="#ffffff"
                                                style={{ backgroundColor: "#3b5998", color: "#ffffff" }} 
                                                ><i className="fa fa-facebook"></i>
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href={profileData.twitter}
                                                className="btn"
                                                style={{ backgroundColor: "#3b5998", color: "#ffffff" }} >
                                                <i className="fa fa-twitter"></i >
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href={profileData.linkedin}
                                                className="btn"
                                                style={{ backgroundColor: "#3b5998", color: "#ffffff" }}>
                                                <i className="fa fa-linkedin"></i>
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href={profileData.instagram}
                                                className="btn"
                                                style={{ backgroundColor: "#3b5998", color: "#ffffff" }} >
                                                <i className="fa fa-instagram"></i>
                                            </a>
                                        </li>
                                        
                                    </ul>
                                </div>
                                
                            </div>
                        </div>
                        <div className="col-xl-8 col-lg-8 col-md-8 col-sm-12 mb-30">
                            <div className="card-box height-100-p overflow-hidden">
                                <div className="profile-tab height-100-p">
                                    <div className="tab height-100-p">
                                        <ul className="nav nav-tabs customtab" role="tablist">

                                            {/* <li className="nav-item">
                                                <a
                                                    className={`nav-link ${activeTab === "tasks" ? "active" : ""}`}
                                                    
                                                    role="tab"
                                                    onClick={() => setActiveTab("tasks")}
                                                >
                                                    Tasks
                                                </a>
                                                </li> */}
                                                <li className="nav-item">
                                                    <a className={`nav-link ${activeTab === "settings" ? "active" : ""}`} role="tab"
                                                    onClick={() => setActiveTab("settings")}>
                                                    Settings
                                                    </a>
                                                </li>
                                        </ul>

                                            
                                        <div className="tab-content">
                                                
                                                    <div className={`tab-pane fade ${activeTab === "tasks" ? "show active" : ""}`} id="tasks" role="tabpanel">
                                                        <div className="pd-20 profile-task-wrap">
                                                            <div className="container pd-0">
                                                                <div className="task-title row align-items-center">
                                                                    <div className="col-md-8 col-sm-12">
                                                                    <h5>Lab Name</h5>
                                                                    </div>
                                                                    <div className="col-md-4 col-sm-12 text-right">
                                                                    <button className=" btn text-primary weight-500 hover:text-white " onClick={() => setShowForm(!showForm)}  style={{ backgroundColor: "#E1E1F5" }}>
                                                                        <i className="ion-plus-round text-primary"></i> Add
                                                                    </button>
                                                                    </div>
                                                                </div>

                                                                 {/* Task List */}
                                                                <div className="profile-task-list pb-30">
                                                                    <ul>
                                                                    <li>
                                                                        <div className="custom-control custom-checkbox mb-5">
                                                                        <input type="checkbox" className="custom-control-input" id="task-1" />
                                                                        <label className="custom-control-label" htmlFor="task-1"></label>
                                                                        </div>
                                                                        Lab A
                                                                    </li>
                                                                    </ul>
                                                                </div>

                                                                {/* Add Task Modal */}
                                                                {showForm && (
                                                                    <div className="modal fade customscroll" id="task-add" tabindex="-1" role="dialog">
                                                                        <div
                                                                            className="modal-dialog modal-dialog-centered"
                                                                            role="document"
                                                                        >
                                                                            <div className="modal-content">
                                                                                <div className="modal-header">
                                                                                    <h5 className="modal-title"  id="exampleModalLongTitle"  >
                                                                                                    Tasks Add
                                                                                    </h5>
                                                                                    <button
                                                                                         type="button"
                                                                                        className="close"
                                                                                        data-dismiss="modal"
                                                                                        aria-label="Close"
                                                                                        data-toggle="tooltip"
                                                                                        data-placement="bottom"
                                                                                        title=""
                                                                                        data-original-title="Close Modal"
                                                                                    >
                                                                                        <span aria-hidden="true">&times;</span>
                                                                                    </button>
                                                                                </div>
                                                                                <div className="modal-body pd-0">
                                                                                    <div className="task-list-form">
                                                                                        <form>
                                                                                            <div className="form-group row">
                                                                                                <label className="col-md-4">Lab Type</label>
                                                                                                <div className="col-md-8">
                                                                                                            <input type="text" className="form-control" />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="form-group row">
                                                                                                <label className="col-md-4">Lab Name</label>
                                                                                                <div className="col-md-8">
                                                                                                            <input type="text" className="form-control" />
                                                                                                </div>
                                                                                            </div>                                      
                                                                                        </form>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="modal-footer">
                                                                                    <button type="button" className="btn btn-success"
                                                                                        onClick={() => alert("Task Added!")} >
                                                                                        Submit 
                                                                                    </button>
                                                                                    <button type="button" className="btn btn-danger ml-2"
                                                                                        onClick={() => setShowForm(false)} >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                            {/* Settings Tab */}
                                            <div className={`tab-pane fade ${activeTab === "settings" ? "show active" : ""}`} id="settings" role="tabpanel">
                                                <div className="profile-setting">
                                                    <form /* onSubmit={handleSubmit} */>
                                                        <ul className="profile-edit-list row">
                                                            <li className="weight-500 col-md-6">
                                                                <h4 className="text-primary h5 mb-20">
																	Edit Your Personal Setting
																</h4>
                                                                <div className="form-group">
                                                                    <label>Full Name</label>
                                                                    <input type="text" className="form-control form-control-lg" name="fullName" value={profileData.fullName} onChange={handleChange} required />
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>Email</label>
                                                                    <input type="email" className="form-control form-control-lg" name="email" value={profileData.email} onChange={handleChange} required />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label>Phone Number</label>
                                                                    <input type="text" className="form-control form-control-lg" name="phone" value={profileData.phone} onChange={handleChange} />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label>Date of Birth</label>
                                                                    <input type="date" className="form-control form-control-lg date-picker" name="dob" value={profileData.dob} onChange={handleChange} />
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>Gender</label>
                                                                    <select className="form-control" name="gender" value={profileData.gender} onChange={handleChange}>
                                                                        <option value="">Select</option>
                                                                        <option value="Male">Male</option>
                                                                        <option value="Female">Female</option>
                                                                    </select>
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>Country</label>
                                                                    <input type="text" className="form-control form-control-lg" name="country" value={profileData.country} onChange={handleChange} />
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>State/Province/Region</label>
                                                                    <input type="text" className="form-control form-control-lg" name="state" value={profileData.state} onChange={handleChange} />
                                                                </div>
                                                                <div className="form-group">
																	<label>Address</label>
																	<input className="form-control form-control-lg" name="address" value={profileData.address} onChange={handleChange} />
																</div>
                                                                <div className="form-group">
                                                                <label>Profile Picture</label>
                                                                    <input 
                                                                        type="file" 
                                                                        className="form-control form-control-lg" 
                                                                        accept="image/*" 
                                                                        onChange={handleImageChange}
                                                                    />
                                                                </div>
                                                                <div className="form-group mb-0">
																	<input
																		type="button"
																		className="btn btn-primary"
																		value="Update Information"
                                                                        onClick={handleSubmit}
																	/>
																</div>
                                                                
															</li>
                                                            <li className="weight-500 col-md-6">
                                                                <h4 className="text-primary h5 mb-20">Social Media Links</h4>
                                                                <div className="form-group">
                                                                    <label>Facebook</label>
                                                                    <input type="text" className="form-control form-control-lg" name="facebook" placeholder="Paste your link here" value={profileData.facebook} onChange={handleChange} />
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>Twitter</label>
                                                                    <input type="text" className="form-control form-control-lg" name="twitter"  placeholder="Paste your link here"value={profileData.twitter} onChange={handleChange} />
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>LinkedIn</label>
                                                                    <input type="text" className="form-control form-control-lg" name="linkedin" placeholder="Paste your link here" value={profileData.linkedin} onChange={handleChange} />
                                                                </div>

                                                                <div className="form-group">
                                                                    <label>Instagram</label>
                                                                    <input type="text" className="form-control form-control-lg" name="instagram"  placeholder="Paste your link here" value={profileData.instagram} onChange={handleChange} />
                                                                </div>

                                                                <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save & Update</button>
                                                                <br /><br />
                                                                <h4 className="text-primary h5 mb-20">Change Password</h4>
                                                                <div className="form-group">
                                                                    <label>New Password</label>
                                                                    <input type="text" className="form-control form-control-lg" name="instagram"   onChange={(e) => setPasswordChange(e.target.value)} placeholder="Write Your New Password Here"   />
                                                                </div>

                                                                <button type="button" className="btn btn-primary" onClick={handleChangePassword}>Save & Update Password</button>
                                                            </li>
                                                        </ul>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>    
                    </div>
                </div>
            </div>
        </div>
        
      );
}

export default Profile;
