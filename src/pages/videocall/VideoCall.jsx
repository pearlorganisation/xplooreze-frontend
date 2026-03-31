// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import ConnectyCube from "connectycube";
// import { Excalidraw } from "@excalidraw/excalidraw";
// import "@excalidraw/excalidraw/index.css";
// import "./VideoCall.css";

// // --- Import class tracking API functions ---
// import {
//   startClassJoin,
//   updateClassJoin,
// } from "../../data/modules/booking-module";

// // --- Import Firestore services ---
// import {
//   listenToWhiteboard,
//   updateWhiteboardElements,
//   addWhiteboardFile,
// } from "./whiteboard-services"; // Using your specified path

// // Icons
// import {
//   FaVideo,
//   FaMicrophone,
//   FaMicrophoneSlash,
//   FaVideoSlash,
//   FaPhoneSlash,
//   FaExpand,
//   FaCompress,
//   FaChalkboard,
// } from "react-icons/fa";

// /**
//  * Helper function to calculate the duration of the booking in milliseconds.
//  */
// const getBookingDurationInMs = (booking) => {
//   try {
//     const [startHour, startMin] = booking.startTime.split(":").map(Number);
//     const [endHour, endMin] = booking.endTime.split(":").map(Number);
//     const totalStartMinutes = startHour * 60 + startMin;
//     const totalEndMinutes = endHour * 60 + endMin;
//     const durationInMinutes = totalEndMinutes - totalStartMinutes;
//     if (durationInMinutes <= 0) return null;
//     return durationInMinutes * 60 * 1000;
//   } catch (e) {
//     console.error("Error calculating booking duration:", e);
//     return null;
//   }
// };

// const VideoCall = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { booking, isTutor = true } = location.state || {};

//   // --- Refs for all critical objects ---
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const videoContainerRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const remoteStreamRef = useRef(null);
//   const sessionRef = useRef(null);
//   const isMountedRef = useRef(true);

//   // --- Refs for timers ---
//   const updateIntervalRef = useRef(null);
//   const bookingEndTimerRef = useRef(null);

//   // --- State for UI rendering ---
//   const [isMutedAudio, setIsMutedAudio] = useState(true);
//   const [isMutedVideo, setIsMutedVideo] = useState(true);
//   const [isFullScreen, setIsFullScreen] = useState(false);
//   const [isSwapped, setIsSwapped] = useState(false);
//   const [callState, setCallState] = useState("connecting");
//   const [error, setError] = useState("");


//   // --- Ref for echo prevention ---
//   const isUpdatingFromRemoteRef = useRef(false);

//   // For Excalidraw
//   const debounceHandlerRef = useRef(null);
//   const [showWhiteboard, setShowWhiteboard] = useState(false);
//   const excalidrawApiRef = useRef(null);
//   const lastSentElementsRef = useRef(null);
//   const lastReceivedElementsRef = useRef(null);

//   // --- Ref to track sent files ---
//   const sentFilesRef = useRef(new Set());

//   // --- State for Firestore listener ---
//   const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
//   const firestoreUnsubscribeRef = useRef(null);

//   if (!booking) {
//     return <div className="error-screen">No booking data provided.</div>;
//   }

//   const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
//   const opponentUser = isTutor
//     ? booking.studentId || {}
//     : booking.tutorId || {};

//   if (!currentUser.cb_id || !opponentUser.cb_id || !currentUser.email) {
//     console.log(currentUser);
//     return (
//       <div className="error-screen">
//         Missing user credentials for video call.
//       </div>
//     );
//   }

//   const userId = parseInt(currentUser.cb_id);
//   const opponentId = parseInt(opponentUser.cb_id);
//   const login = currentUser.email;
//   const password = currentUser.email;

//   // --- Stream stopping functions ---
//   const stopLocalStream = (stream) => {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//     }
//   };
//   const stopRemoteStream = (stream) => {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//     }
//   };

//   // --- Timer cleanup function ---
//   const clearAllTimers = () => {
//     if (updateIntervalRef.current) {
//       clearInterval(updateIntervalRef.current);
//       updateIntervalRef.current = null;
//     }
//     if (bookingEndTimerRef.current) {
//       clearTimeout(bookingEndTimerRef.current);
//       bookingEndTimerRef.current = null;
//     }
//   };

//   // --- Helper function to poll for file data ---
//   const waitForFileData = (fileId, pollInterval = 100, maxAttempts = 20) => {
//     return new Promise((resolve, reject) => {
//       let attempts = 0;
//       const poll = () => {
//         if (!isMountedRef.current) {
//           return reject(
//             new Error("Component unmounted while waiting for file data."),
//           );
//         }

//         const files = excalidrawApiRef.current?.getFiles();
//         const fileData = files ? files[fileId] : null;

//         if (fileData && fileData.dataURL) {
//           resolve(fileData);
//         } else if (attempts >= maxAttempts) {
//           reject(
//             new Error(
//               `Failed to get file data for fileId ${fileId} after ${attempts} attempts.`,
//             ),
//           );
//         } else {
//           attempts++;
//           setTimeout(poll, pollInterval);
//         }
//       };
//       poll();
//     });
//   };

//   // --- Main Effect with Cleanup Logic ---
//   useEffect(() => {
//     isMountedRef.current = true;
//     const originalListeners = {
//       onRemoteStreamListener:
//         ConnectyCube.videochat?.onRemoteStreamListener || null,
//       onCallListener: ConnectyCube.videochat?.onCallListener || null,
//       onUserNotAnswerListener:
//         ConnectyCube.videochat?.onUserNotAnswerListener || null,
//       onRejectCallListener:
//         ConnectyCube.videochat?.onRejectCallListener || null,
//       onStopCallListener: ConnectyCube.videochat?.onStopCallListener || null,
//       onDisconnectedListener: ConnectyCube.chat?.onDisconnectedListener || null,
//     };

//     const initSDK = async () => {
//       try {
//         // --- 1. Init SDK ---
//         const CREDENTIALS = {
//           appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID || "0"),
//           authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY || "",
//         };
//         if (CREDENTIALS.appId && CREDENTIALS.authKey) {
//           ConnectyCube.init(CREDENTIALS);
//         } else {
//           throw new Error("Missing ConnectyCube credentials");
//         }

//         // --- 2. Create Session ---
//         if (!ConnectyCube.session) {
//           await ConnectyCube.createSession({ login, password });
//         }
//         if (!isMountedRef.current) return;

//         // --- 3. Connect to Chat ---
//         if (!ConnectyCube.chat.isConnected) {
//           const userCredentials = { userId, password };
//           await ConnectyCube.chat.connect(userCredentials);

//           let attempts = 0;
//           const maxAttempts = 60;
//           while (!ConnectyCube.chat.isConnected && attempts < maxAttempts) {
//             if (!isMountedRef.current) return;
//             await new Promise((resolve) => setTimeout(resolve, 500));
//             attempts++;
//           }
//           if (!ConnectyCube.chat.isConnected) {
//             throw new Error("Chat connection failed after polling.");
//           }
//         }
//         if (!isMountedRef.current) return;

//         // --- 4. Set up Listeners ---

//         // Remove whiteboard logic from CC chat listener
//         ConnectyCube.chat.onMessageListener = (senderId, message) => {
//           console.log("Received unhandled CC chat message:", message.body);
//         };

//         // This listener handles class tracking
//         ConnectyCube.videochat.onRemoteStreamListener = (
//           callSession,
//           userID,
//           remoteStream,
//         ) => {
//           console.log("Remote stream received");
//           remoteStreamRef.current = remoteStream;
//           try {
//             callSession.attachMediaStream("remoteVideo", remoteStream);
//           } catch (attachError) {
//             console.error("Error attaching remote stream:", attachError);
//           }
//           if (isMountedRef.current) {
//             setCallState("active");

//             // --- Your class tracking logic (UNMODIFIED) ---
//             console.log("Call active. Starting class join tracking.");
//             startClassJoin(booking._id);
//             if (updateIntervalRef.current) {
//               clearInterval(updateIntervalRef.current);
//             }
//             updateIntervalRef.current = setInterval(() => {
//               updateClassJoin(booking._id);
//             }, 60000);
//             // --- End of class tracking logic ---

//             if (isTutor) {
//               const durationInMs = getBookingDurationInMs(booking);
//               if (durationInMs) {
//                 if (bookingEndTimerRef.current) {
//                   clearTimeout(bookingEndTimerRef.current);
//                 }
//                 bookingEndTimerRef.current = setTimeout(() => {
//                   if (isMountedRef.current) {
//                     alert(
//                       "The scheduled class time has ended. Please end the class.",
//                     );
//                   }
//                 }, durationInMs);
//               }
//             }
//           }
//         };

//         // --- All other ConnectyCube listeners ---
//         ConnectyCube.videochat.onCallListener = async (
//           callSession,
//           extension,
//         ) => {
//           console.log("Incoming call");
//           if (!isMountedRef.current) return;
//           sessionRef.current = callSession;
//           if (!isTutor) {
//             if (isMountedRef.current) setCallState("connecting");
//             let localStream = null;
//             try {
//               const mediaParams = {
//                 audio: true,
//                 video: {
//                   width: { ideal: 640 },
//                   height: { ideal: 480 },
//                   frameRate: { ideal: 15 },
//                 },
//               };
//               localStream = await callSession.getUserMedia(mediaParams);
//               if (!isMountedRef.current) {
//                 stopLocalStream(localStream);
//                 return;
//               }
//               // --- ADD THESE LINES ---
//               callSession.mute("audio");
//               callSession.mute("video");
//               // -----------------------
//               localStreamRef.current = localStream;
//               try {
//                 callSession.attachMediaStream("localVideo", localStream, {
//                   muted: true,
//                 });
//               } catch (attachError) {
//                 console.error("Error attaching local stream:", attachError);
//               }
//               callSession.accept({});
//             } catch (err) {
//               console.error("Error accepting call:", err);
//               stopLocalStream(localStream);
//               localStreamRef.current = null;
//               if (isMountedRef.current) {
//                 setError(
//                   "Failed to join call. Please check microphone and camera permissions.",
//                 );
//                 setCallState("ended");
//               }
//               callSession.reject({});
//             }
//           } else {
//             if (isMountedRef.current) setCallState("ringing");
//           }
//         };

//         ConnectyCube.videochat.onUserNotAnswerListener = (
//           callSession,
//           userId,
//         ) => {
//           console.log("User not answered");
//           if (isMountedRef.current) {
//             setError("Opponent did not answer");
//             setCallState("ended");
//           }
//         };

//         ConnectyCube.videochat.onRejectCallListener = (
//           callSession,
//           userId,
//           extension,
//         ) => {
//           console.log("Call rejected");
//           if (isMountedRef.current) {
//             setError("Call rejected by opponent");
//             setCallState("ended");
//           }
//         };

//         ConnectyCube.videochat.onStopCallListener = (
//           callSession,
//           userId,
//           extension,
//         ) => {
//           console.log("Call stopped");
//           if (isMountedRef.current) {
//             setCallState("ended");
//           }
//         };

//         ConnectyCube.videochat.onDisconnectedListener = () => {
//           console.log("Chat disconnected");
//           if (isMountedRef.current) {
//             setError("Connection lost. Please restart the call.");
//             setCallState("ended");
//           }
//         };

//         // --- 5. Start Call (if tutor) ---
//         if (isTutor) {
//           startCall();
//         } else {
//           if (isMountedRef.current) {
//             setCallState("waiting");
//           }
//         }
//       } catch (authError) {
//         console.error("Authentication/Connection error:", authError);
//         if (isMountedRef.current) {
//           setError(
//             `Failed to connect: ${authError.message || "Please check credentials and try again."}`,
//           );
//           setCallState("ended");
//         }
//       }
//     };

//     initSDK();

//     // --- Cleanup Function ---
//     return () => {
//       console.log("VideoCall component unmounting. Running cleanup...");
//       isMountedRef.current = false;

//       clearAllTimers();

//       // Restore original listeners
//       if (originalListeners.onRemoteStreamListener !== null) {
//         ConnectyCube.videochat.onRemoteStreamListener =
//           originalListeners.onRemoteStreamListener;
//       }
//       if (originalListeners.onCallListener !== null) {
//         ConnectyCube.videochat.onCallListener =
//           originalListeners.onCallListener;
//       }
//       if (originalListeners.onUserNotAnswerListener !== null) {
//         ConnectyCube.videochat.onUserNotAnswerListener =
//           originalListeners.onUserNotAnswerListener;
//       }
//       if (originalListeners.onRejectCallListener !== null) {
//         ConnectyCube.videochat.onRejectCallListener =
//           originalListeners.onRejectCallListener;
//       }
//       if (originalListeners.onStopCallListener !== null) {
//         ConnectyCube.videochat.onStopCallListener =
//           originalListeners.onStopCallListener;
//       }
//       if (originalListeners.onDisconnectedListener !== null) {
//         ConnectyCube.chat.onDisconnectedListener =
//           originalListeners.onDisconnectedListener;
//       }

//       // Stop streams and sessions
//       stopLocalStream(localStreamRef.current);
//       stopRemoteStream(remoteStreamRef.current);
//       localStreamRef.current = null;
//       remoteStreamRef.current = null;

//       if (sessionRef.current) {
//         sessionRef.current.stop({});
//         sessionRef.current = null;
//       }
//       if (ConnectyCube.chat.isConnected) {
//         ConnectyCube.chat.disconnect();
//       }
//       if (debounceHandlerRef.current) {
//         clearTimeout(debounceHandlerRef.current);
//         debounceHandlerRef.current = null;
//       }

//       // Cleanup Firestore listener
//       if (firestoreUnsubscribeRef.current) {
//         console.log("Unsubscribing from Firestore listener.");
//         firestoreUnsubscribeRef.current();
//         firestoreUnsubscribeRef.current = null;
//       }

//       console.log("Cleanup complete.");
//     };
//   }, [isTutor, booking._id]); // Dependencies

//   // --- New Effect for Firestore Whiteboard Listener ---
//   useEffect(() => {
//     // Wait until Excalidraw API is ready and we have the booking ID
//     if (!isExcalidrawReady || !booking._id || !excalidrawApiRef.current) {
//       return;
//     }

//     console.log("Firestore: Setting up whiteboard listener for:", booking._id);

//     const handleRemoteUpdate = (data) => {
//       if (!isMountedRef.current || !data) return;

//       // --- 1. Echo Prevention ---
//       if (data.lastUpdatedBy === currentUser.cb_id) {
//         console.log("Firestore: Ignoring echo of my own update.");
//         return;
//       }

//       console.warn("Firestore RECEIVER: Applying remote update.");
//       isUpdatingFromRemoteRef.current = true; // Set flag to prevent resending

//       // --- 2. Update Elements ---
//       // Check if elements exist and is a string, then parse it
//       if (data.elements && typeof data.elements === "string") {
//         let incomingElements = [];
//         try {
//           // Turn the string back into an array
//           incomingElements = JSON.parse(data.elements);
//         } catch (e) {
//           console.error("Failed to parse remote elements:", e, data.elements);
//           isUpdatingFromRemoteRef.current = false;
//           return; // Don't proceed if parsing failed
//         }

//         // Merge logic (unchanged)
//         const existingElements = excalidrawApiRef.current.getSceneElements();
//         const mergedElementsMap = new Map(
//           existingElements.map((el) => [el.id, el]),
//         );

//         incomingElements.forEach((incomingEl) => {
//           const existingEl = mergedElementsMap.get(incomingEl.id);
//           if (!existingEl || incomingEl.version > existingEl.version) {
//             mergedElementsMap.set(incomingEl.id, incomingEl);
//           }
//         });

//         const mergedElements = Array.from(mergedElementsMap.values());
//         lastReceivedElementsRef.current = mergedElements;

//         excalidrawApiRef.current.updateScene({
//           elements: mergedElements,
//         });
//       } // end if (data.elements)

//       // --- 3. Update Files ---
//       if (data.files && data.files.length > 0) {
//         console.warn("Firestore RECEIVER: Adding remote files.");
//         excalidrawApiRef.current.addFiles(data.files);
//       }
//     };

//     // Start listening and store the unsubscribe function
//     // Pass the cb_id from currentUser and opponentUser for initialization
//     const unsubscribe = listenToWhiteboard(
//       booking._id,
//       currentUser.cb_id,
//       opponentUser.cb_id,
//       handleRemoteUpdate,
//     );
//     firestoreUnsubscribeRef.current = unsubscribe;
//   }, [isExcalidrawReady, booking._id, currentUser.cb_id, opponentUser.cb_id]); // Add dependencies

//   const requestMediaPermissions = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: true,
//       });
//       stream.getTracks().forEach((track) => track.stop());
//       return true;
//     } catch (err) {
//       console.error("Permission denied:", err);
//       return false;
//     }
//   };

//   const startCall = async () => {
//     let localStream = null;
//     try {
//       const hasPermissions = await requestMediaPermissions();
//       if (!hasPermissions) {
//         throw new Error(
//           "Media permissions denied. Please allow camera and microphone access.",
//         );
//       }
//       if (!isMountedRef.current) return;
//       if (!ConnectyCube.chat.isConnected) {
//         throw new Error(
//           "Not connected to chat. Please ensure authentication succeeded.",
//         );
//       }
//       if (isMountedRef.current) setCallState("connecting");

//       const calleesIds = [opponentId];
//       const sessionType = ConnectyCube.videochat.CallType.VIDEO;
//       const newSession = ConnectyCube.videochat.createNewSession(
//         calleesIds,
//         sessionType,
//         {},
//       );
//       sessionRef.current = newSession;

//       const mediaParams = {
//         audio: true,
//         video: {
//           width: { ideal: 640 },
//           height: { ideal: 480 },
//           frameRate: { ideal: 15 },
//         },
//       };
//       localStream = await newSession.getUserMedia(mediaParams);
//       if (!isMountedRef.current) {
//         stopLocalStream(localStream);
//         return;
//       }
//       // --- ADD THESE LINES ---
//       newSession.mute("audio");
//       newSession.mute("video");
//       // -----------------------
//       localStreamRef.current = localStream;
//       try {
//         newSession.attachMediaStream("localVideo", localStream, {
//           muted: true,
//         });
//       } catch (attachError) {
//         console.error("Error attaching local stream:", attachError);
//       }

//       const extension = { bookingId: booking._id };
//       newSession.call(extension, (error) => {
//         if (error) {
//           stopLocalStream(localStreamRef.current);
//           localStreamRef.current = null;
//           if (isMountedRef.current) {
//             setError("Failed to initiate call. Please try again.");
//             setCallState("ended");
//           }
//         } else {
//           if (isMountedRef.current) setCallState("ringing");
//         }
//       });
//     } catch (err) {
//       console.error("Error starting call:", err);

//       // --- FIX #3: Aggressive stream cleanup ---
//       // Stop both just to be safe.
//       stopLocalStream(localStream);
//       stopLocalStream(localStreamRef.current);
//       // --- END FIX ---

//       localStreamRef.current = null;
//       let errorMsg = "Failed to start video call.";
//       if (
//         err.name === "NotAllowedError" ||
//         err.message.includes("permission")
//       ) {
//         errorMsg += " Please check microphone and camera permissions.";
//       } else if (err.message.includes("Not connected to chat")) {
//         errorMsg += " Chat connection failed. Please refresh.";
//       } else {
//         errorMsg += ` ${err.message || "Please check permissions."}`;
//       }
//       if (isMountedRef.current) {
//         setError(errorMsg);
//         setCallState("ended");
//       }
//     }
//   };

//   // --- FIX #2: Reliable Mute ---
//   const toggleMuteAudio = () => {
//     if (!sessionRef.current) return;

//     setIsMutedAudio((prevIsMuted) => {
//       const newMutedState = !prevIsMuted;
//       if (newMutedState) {
//         sessionRef.current.mute("audio");
//       } else {
//         sessionRef.current.unmute("audio");
//       }
//       return newMutedState;
//     });
//   };

//   // --- FIX #2: Reliable Mute ---
//   const toggleMuteVideo = () => {
//     if (!sessionRef.current) return;

//     setIsMutedVideo((prevIsMuted) => {
//       const newMutedState = !prevIsMuted;
//       if (newMutedState) {
//         sessionRef.current.mute("video");
//       } else {
//         sessionRef.current.unmute("video");
//       }
//       return newMutedState;
//     });
//   };

//   const endCall = () => {
//     clearAllTimers();
//     // --- Your class tracking logic (UNMODIFIED) ---
//     if (callState === "active") {
//       updateClassJoin(booking._id);
//     }
//     // --- End of class tracking logic ---
//     stopLocalStream(localStreamRef.current);
//     stopRemoteStream(remoteStreamRef.current);
//     localStreamRef.current = null;
//     remoteStreamRef.current = null;
//     if (sessionRef.current) {
//       sessionRef.current.stop({});
//       sessionRef.current = null;
//     }
//     if (isMountedRef.current) setCallState("ended");
//     navigate(-1);
//   };

//   const toggleFullScreen = () => {
//     const videoContainer = videoContainerRef.current;
//     if (!isFullScreen) {
//       if (videoContainer && videoContainer.requestFullscreen) {
//         videoContainer.requestFullscreen();
//       }
//     } else {
//       if (document.exitFullscreen) {
//         document.exitFullscreen();
//       }
//     }
//     setIsFullScreen(!isFullScreen);
//   };

//   const handleFullscreenChange = () => {
//     setIsFullScreen(!!document.fullscreenElement);
//   };

//   useEffect(() => {
//     document.addEventListener("fullscreenchange", handleFullscreenChange);
//     return () =>
//       document.removeEventListener("fullscreenchange", handleFullscreenChange);
//   }, []);

//   // --- FIX #1: Echo Fix ---
//   // This function now *only* toggles the state.
//   // React handles the class swapping in the JSX.
//   const swapVideos = () => {
//     setIsSwapped((prev) => !prev);
//   };
//   // --- END FIX ---

//   if (callState === "waiting") {
//     return (
//       <div className="waiting-screen">
//         <div className="waiting-content">
//           <FaVideo className="waiting-icon" />
//           <h2>Waiting for tutor to start the session</h2>
//           <p>
//             {booking.subject} -{" "}
//             {new Date(booking.startDate).toLocaleDateString()}{" "}
//             {booking.startTime}
//           </p>
//           <button onClick={() => navigate(-1)} className="back-btn">
//             Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // --- Whiteboard functions ---
//   const sendUpdatesWithDebounce = (elements) => {
//     if (debounceHandlerRef.current) {
//       clearTimeout(debounceHandlerRef.current);
//     }
//     debounceHandlerRef.current = setTimeout(() => {
//       // --- Use Firestore service ---
//       if (!isMountedRef.current) {
//         console.error(
//           "SENDER (Firestore): Cannot send element update, not ready.",
//         );
//         return;
//       }

//       console.warn("SENDER (Firestore): Sending debounced element update.");
//       // Send update to Firestore, passing our cb_id for echo prevention
//       updateWhiteboardElements(booking._id, elements, currentUser.cb_id);

//       lastSentElementsRef.current = JSON.parse(JSON.stringify(elements)); // This is just a local copy, stringify is fine
//     }, 100); // 100ms debounce
//   };

//   const toggleWhiteboard = () => {
//     setShowWhiteboard((s) => !s);
//   };

//   const handleWhiteboardChange = (elements, appState, files) => {
//     // --- 1. Echo Prevention ---
//     if (isUpdatingFromRemoteRef.current) {
//       // This change came from Firestore, don't send it back
//       isUpdatingFromRemoteRef.current = false;
//       return;
//     }

//     if (!isMountedRef.current || !showWhiteboard) return;

//     // --- 2. Send Element Updates (Debounced) ---
//     // This logic just checks if a send is needed
//     const oldIds = lastSentElementsRef.current
//       ? new Set(
//         lastSentElementsRef.current.map((el) => `${el.id}-${el.version}`),
//       )
//       : new Set();
//     const newIds = new Set(elements.map((el) => `${el.id}-${el.version}`));

//     let hasChanged = oldIds.size !== newIds.size;
//     if (!hasChanged) {
//       for (let id of newIds) {
//         if (!oldIds.has(id)) {
//           hasChanged = true;
//           break;
//         }
//       }
//     }

//     if (hasChanged) {
//       console.warn(
//         "SENDER: Detected element changes, queueing Firestore update.",
//       );
//       sendUpdatesWithDebounce(elements);
//     }

//     // --- 3. Check for and send new files ---
//     for (const element of elements) {
//       // Check if it's an image, has a fileId, and we haven't sent it yet
//       if (
//         element.type === "image" &&
//         element.fileId &&
//         !sentFilesRef.current.has(element.fileId)
//       ) {
//         const newFileId = element.fileId;
//         sentFilesRef.current.add(newFileId); // Mark as "sending"

//         console.log(
//           `SENDER (Firestore): Detected new image (fileId: ${newFileId}). Polling...`,
//         );

//         waitForFileData(newFileId)
//           .then((fileData) => {
//             if (!isMountedRef.current) return;

//             // --- Use Firestore service ---
//             console.log(
//               `SENDER (Firestore): Sending file data for ${newFileId}.`,
//             );
//             addWhiteboardFile(booking._id, fileData, currentUser.cb_id);
//           })
//           .catch((err) => {
//             if (!isMountedRef.current) return;
//             console.error(
//               `SENDER (Firestore): Poller for ${newFileId} failed.`,
//               err.message,
//             );
//             sentFilesRef.current.delete(newFileId); // Allow retry
//           });
//       }
//     }
//   };

//   if (callState === "ended" || error) {
//     return (
//       <div className="error-screen">
//         <h2>{error || "Call Ended"}</h2>
//         <button onClick={() => navigate(-1)} className="back-btn">
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="video-call-page">
//       <div className="video-container" ref={videoContainerRef}>
//         {callState === "ringing" && isTutor && (
//           <div className="ringing-screen">
//             <FaVideo className="ringing-icon" />
//             <h3>Calling...</h3>
//           </div>
//         )}
//         <video
//           ref={remoteVideoRef}
//           id="remoteVideo"
//           autoPlay
//           playsInline
//           className={`remote-video ${isSwapped ? "small-video" : "big-video"}`}
//           onClick={callState === "active" ? swapVideos : undefined}
//         />
//         <video
//           ref={localVideoRef}
//           id="localVideo"
//           autoPlay
//           muted // This 'muted' prop is crucial and correct
//           playsInline
//           className={`local-video ${isSwapped ? "big-video" : "small-video"}`}
//           onClick={callState === "active" ? swapVideos : undefined}
//         />
//       </div>

//       <div
//         className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}
//       >
//         <button className="close-whiteboard-btn" onClick={toggleWhiteboard}>
//           &times;
//         </button>
//         <Excalidraw
//           // --- Set state when API is ready ---
//           excalidrawAPI={(api) => {
//             excalidrawApiRef.current = api;
//             setIsExcalidrawReady(true); // Signal that listener can be attached
//           }}
//           onChange={handleWhiteboardChange}
//           initialData={{ elements: [] }}
//           theme="light"
//         />
//       </div>

//       <footer className="call-footer">
//         <h2>{booking.subject}</h2>
//         <p>
//           {new Date(booking.startDate).toLocaleDateString()} |{" "}
//           {booking.startTime} - {booking.endTime}
//         </p>
//         <span className={`call-status ${callState}`}>
//           {callState.toUpperCase()}
//         </span>
//       </footer>

//       {callState === "active" && (
//         <div className="controls">
//           <button onClick={toggleMuteAudio} className="control-btn audio-btn">
//             {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
//           </button>
//           <button onClick={toggleMuteVideo} className="control-btn video-btn">
//             {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
//           </button>
//           <button
//             onClick={toggleWhiteboard}
//             className={`control-btn whiteboard-btn ${showWhiteboard ? "active" : ""}`}
//           >
//             <FaChalkboard />
//           </button>
//           <button onClick={endCall} className="control-btn end-btn">
//             <FaPhoneSlash />
//           </button>
//           <button
//             onClick={toggleFullScreen}
//             className="control-btn fullscreen-btn"
//           >
//             {isFullScreen ? <FaCompress /> : <FaExpand />}
//           </button>
//         </div>
//       )}

//       {callState === "connecting" && (
//         <div className="loading-screen">
//           <div className="spinner"></div>
//           <p>Connecting...</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VideoCall;



import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConnectyCube from "connectycube";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./VideoCall.css";

import { startClassJoin, updateClassJoin } from "../../data/modules/booking-module";
import { listenToWhiteboard, updateWhiteboardElements, addWhiteboardFile } from "./whiteboard-services";
import { FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaPhoneSlash, FaExpand, FaCompress, FaChalkboard, FaLock, FaSyncAlt } from "react-icons/fa";
import { createPortal } from "react-dom";

const VideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, isTutor = true } = location.state || {};
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const isMountedRef = useRef(true);
  const updateIntervalRef = useRef(null);

  const [isMutedAudio, setIsMutedAudio] = useState(true);
  const [isMutedVideo, setIsMutedVideo] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [error, setError] = useState("");

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  const excalidrawApiRef = useRef(null);
  const firestoreUnsubscribeRef = useRef(null);
  const debounceHandlerRef = useRef(null);
  const isUpdatingFromRemoteRef = useRef(false);

  const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
  const opponentUser = isTutor ? booking.studentId || {} : booking.tutorId || {};
  const opponentId = parseInt(opponentUser.cb_id);

  useEffect(() => {
    isMountedRef.current = true;
    const initSDK = async () => {
      try {
        const CREDENTIALS = {
          appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID || "0"),
          authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY || "",
        };
        ConnectyCube.init(CREDENTIALS);
        if (!ConnectyCube.session) {
          await ConnectyCube.createSession({ login: currentUser.email, password: currentUser.email });
        }
        if (!ConnectyCube.chat.isConnected) {
          await ConnectyCube.chat.connect({ userId: parseInt(currentUser.cb_id), password: currentUser.email });
        }

        ConnectyCube.videochat.onRemoteStreamListener = (session, userID, stream) => {
          console.log("Remote stream received from:", userID);
          remoteStreamRef.current = stream;
          session.attachMediaStream("remoteVideo", stream);
          if (isMountedRef.current) setCallState("active");
        };

        ConnectyCube.videochat.onCallListener = (callSession) => {
          sessionRef.current = callSession;
          if (!isTutor) {
            callSession.accept({});
            if (isMountedRef.current) setCallState("active");
            startTracking();
          }
        };

        if (isTutor) {
          const newSession = ConnectyCube.videochat.createNewSession([opponentId], ConnectyCube.videochat.CallType.VIDEO, {});
          sessionRef.current = newSession;
          newSession.call({});
          setCallState("active");
          startTracking();
        } else {
          setCallState("waiting");
        }
      } catch (err) {
        setError("Connection failed: " + err.message);
      }
    };
    initSDK();
    return () => {
      isMountedRef.current = false;
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (sessionRef.current) sessionRef.current.stop({});
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, []);

  const startTracking = () => {
    startClassJoin(booking._id);
    updateIntervalRef.current = setInterval(() => updateClassJoin(booking._id), 60000);
  };

  /**
   * UPDATED: handleMediaToggle
   * Now manually adds tracks to the peer connection so the other side sees/hears you.
   */
  const handleMediaToggle = async (type) => {
    if (!sessionRef.current) return;

    try {
      // 1. Get hardware access if we haven't yet
      if (!localStreamRef.current) {
        const stream = await sessionRef.current.getUserMedia({
          audio: true,
          video: { width: 640, height: 480 }
        });
        localStreamRef.current = stream;

        // Attach locally
        sessionRef.current.attachMediaStream("localVideo", stream, { muted: true });

        // IMPORTANT: Inject tracks into the existing PeerConnection for the other user
        const pc = sessionRef.current.peerConnections[opponentId];
        if (pc) {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
          // This forces a renegotiation so the remote side detects the new tracks
        }
      }

      // 2. Handle Mute/Unmute logic
      if (type === "audio") {
        const newState = !isMutedAudio;
        if (newState) sessionRef.current.mute("audio");
        else sessionRef.current.unmute("audio");
        setIsMutedAudio(newState);
      } else if (type === "video") {
        const newState = !isMutedVideo;
        if (newState) sessionRef.current.mute("video");
        else sessionRef.current.unmute("video");
        setIsMutedVideo(newState);
      }

    } catch (err) {
      console.error("Hardware error:", err);
      if (err.name === "NotAllowedError") setShowPermissionGuide(true);
      else alert("Could not access camera/microphone.");
    }
  };

  const swapVideos = () => setIsSwapped(!isSwapped);
  const endCall = () => { if (sessionRef.current) sessionRef.current.stop({}); navigate(-1); };

  // Permission Guide Modal
  const PermissionGuideModal = () => {
    if (!showPermissionGuide) return null;
    return createPortal(
      <div className="permission-modal-overlay">
        <div className="permission-modal-content">
          <button className="close-x" onClick={() => setShowPermissionGuide(false)}>&times;</button>
          <h2>Permissions Required</h2>
          <p>Please click the lock icon in your address bar and allow Camera and Microphone access, then reload.</p>
          <button className="reload-btn" onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>,
      document.body
    );
  };

  // Whiteboard Logic
  useEffect(() => {
    if (!isExcalidrawReady || !booking._id || !excalidrawApiRef.current) return;
    const handleRemoteUpdate = (data) => {
      if (!isMountedRef.current || !data || data.lastUpdatedBy === currentUser.cb_id) return;
      isUpdatingFromRemoteRef.current = true;
      if (data.elements) excalidrawApiRef.current.updateScene({ elements: JSON.parse(data.elements) });
      if (data.files) excalidrawApiRef.current.addFiles(data.files);
    };
    firestoreUnsubscribeRef.current = listenToWhiteboard(booking._id, currentUser.cb_id, opponentUser.cb_id, handleRemoteUpdate);
  }, [isExcalidrawReady]);

  const handleWhiteboardChange = (elements) => {
    if (isUpdatingFromRemoteRef.current) { isUpdatingFromRemoteRef.current = false; return; }
    if (debounceHandlerRef.current) clearTimeout(debounceHandlerRef.current);
    debounceHandlerRef.current = setTimeout(() => updateWhiteboardElements(booking._id, elements, currentUser.cb_id), 150);
  };

  if (callState === "waiting") return <div className="waiting-screen"><h2>Waiting for tutor...</h2></div>;

  return (
    <div className="video-call-page">
      <div className="video-container" ref={videoContainerRef}>
        <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline className={`remote-video ${isSwapped ? "small-video" : "big-video"}`} onClick={swapVideos} />
        <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline className={`local-video ${isSwapped ? "big-video" : "small-video"} ${isMutedVideo ? 'camera-off' : ''}`} onClick={swapVideos} />
      </div>

      <PermissionGuideModal />

      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <button className="close-whiteboard-btn" onClick={() => setShowWhiteboard(false)}>&times;</button>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }}
          onChange={handleWhiteboardChange}
        />
      </div>

      <footer className="call-footer">
        <h2>{booking.subject}</h2>
        <span className={`call-status ${callState}`}>{callState.toUpperCase()}</span>
      </footer>

      <div className="controls">
        <button onClick={() => handleMediaToggle("audio")} className="control-btn">
          {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={() => handleMediaToggle("video")} className="control-btn">
          {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn ${showWhiteboard ? "active" : ""}`}>
          <FaChalkboard />
        </button>
        <button onClick={endCall} className="control-btn end-btn">
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;








// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import ConnectyCube from "connectycube";
// import { Excalidraw } from "@excalidraw/excalidraw";
// import "@excalidraw/excalidraw/index.css";
// import "./VideoCall.css";

// // --- Import class tracking API functions ---
// import {
//   startClassJoin,
//   updateClassJoin,
// } from "../../data/modules/booking-module";

// // --- Import Firestore services ---
// import {
//   listenToWhiteboard,
//   updateWhiteboardElements,
// } from "./whiteboard-services";

// // Icons
// import {
//   FaVideo,
//   FaMicrophone,
//   FaMicrophoneSlash,
//   FaVideoSlash,
//   FaPhoneSlash,
//   FaExpand,
//   FaCompress,
//   FaChalkboard,
// } from "react-icons/fa";

// const VideoCall = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { booking, isTutor = true } = location.state || {};

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const videoContainerRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const remoteStreamRef = useRef(null);
//   const sessionRef = useRef(null);
//   const isMountedRef = useRef(true);

//   const updateIntervalRef = useRef(null);

//   // --- UI State ---
//   const [isMutedAudio, setIsMutedAudio] = useState(false);
//   const [isMutedVideo, setIsMutedVideo] = useState(false);
//   const [showLobby, setShowLobby] = useState(true);
//   const [callState, setCallState] = useState("connecting");
//   const [error, setError] = useState("");

//   const [showWhiteboard, setShowWhiteboard] = useState(false);
//   const excalidrawApiRef = useRef(null);
//   const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);

//   if (!booking) {
//     return <div className="error-screen">No booking data provided.</div>;
//   }

//   const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
//   const opponentUser = isTutor ? booking.studentId || {} : booking.tutorId || {};

//   const userId = parseInt(currentUser.cb_id);
//   const password = currentUser.email;

//   // --- Helper: Apply Media Settings to Stream and Session ---
//   const applyMediaSettings = (session, stream) => {
//     if (!stream) return;

//     // 1. Manually disable hardware tracks based on current lobby state
//     stream.getAudioTracks().forEach((track) => {
//       track.enabled = !isMutedAudio;
//     });
//     stream.getVideoTracks().forEach((track) => {
//       track.enabled = !isMutedVideo;
//     });

//     // 2. Tell ConnectyCube session to mute
//     if (isMutedAudio) session.mute("audio");
//     if (isMutedVideo) session.mute("video");
//   };

//   const stopLocalStream = (stream) => {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//     }
//   };

//   useEffect(() => {
//     isMountedRef.current = true;

//     const initSDK = async () => {
//       try {
//         const CREDENTIALS = {
//           appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID),
//           authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY,
//         };
//         ConnectyCube.init(CREDENTIALS);

//         if (!ConnectyCube.session) {
//           await ConnectyCube.createSession({ login: currentUser.email, password });
//         }

//         if (!ConnectyCube.chat.isConnected) {
//           await ConnectyCube.chat.connect({ userId, password });
//         }

//         ConnectyCube.videochat.onRemoteStreamListener = (callSession, userID, remoteStream) => {
//           remoteStreamRef.current = remoteStream;
//           callSession.attachMediaStream("remoteVideo", remoteStream);
//           if (isMountedRef.current) {
//             setCallState("active");
//             startClassJoin(booking._id);
//             updateIntervalRef.current = setInterval(() => updateClassJoin(booking._id), 60000);
//           }
//         };

//         ConnectyCube.videochat.onCallListener = (callSession) => {
//           if (!isMountedRef.current) return;
//           sessionRef.current = callSession;
//           if (!isTutor) {
//             setCallState("ringing"); // Student is being called
//           }
//         };

//         ConnectyCube.videochat.onStopCallListener = () => {
//           if (isMountedRef.current) setCallState("ended");
//         };

//         if (isTutor) {
//           setCallState("ready"); // Tutor is ready to initiate
//         } else {
//           setCallState("waiting"); // Student waits for tutor
//         }

//       } catch (authError) {
//         setError("Connection failed. Please refresh.");
//         setCallState("ended");
//       }
//     };

//     initSDK();

//     return () => {
//       isMountedRef.current = false;
//       if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
//       stopLocalStream(localStreamRef.current);
//       if (sessionRef.current) sessionRef.current.stop({});
//       if (ConnectyCube.chat.isConnected) ConnectyCube.chat.disconnect();
//     };
//   }, []);

//   // --- Tutor Starts Call ---
//   const startCall = async () => {
//     try {
//       setShowLobby(false);
//       setCallState("connecting");

//       const calleesIds = [parseInt(opponentUser.cb_id)];
//       const session = ConnectyCube.videochat.createNewSession(calleesIds, ConnectyCube.videochat.CallType.VIDEO);
//       sessionRef.current = session;

//       const stream = await session.getUserMedia({ audio: true, video: true });
//       localStreamRef.current = stream;

//       // Apply Mute/Unmute BEFORE calling
//       applyMediaSettings(session, stream);

//       session.attachMediaStream("localVideo", stream, { muted: true });
//       session.call({ bookingId: booking._id }, (error) => {
//         if (error) {
//           setError("Failed to start call.");
//           setCallState("ended");
//         } else {
//           setCallState("ringing");
//         }
//       });
//     } catch (err) {
//       setError("Could not access camera/microphone.");
//       setCallState("ended");
//     }
//   };

//   // --- Student Joins Call ---
//   const joinCall = async () => {
//     try {
//       setShowLobby(false);
//       const session = sessionRef.current;

//       const stream = await session.getUserMedia({ audio: true, video: true });
//       localStreamRef.current = stream;

//       // Apply Mute/Unmute BEFORE accepting
//       applyMediaSettings(session, stream);

//       session.attachMediaStream("localVideo", stream, { muted: true });
//       session.accept({});
//       setCallState("active");
//     } catch (err) {
//       setError("Media error.");
//       setCallState("ended");
//     }
//   };

//   const toggleMuteAudio = () => {
//     const newState = !isMutedAudio;
//     setIsMutedAudio(newState);

//     // Update hardware track directly
//     if (localStreamRef.current) {
//       localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !newState);
//     }
//     // Update session
//     if (sessionRef.current) {
//       newState ? sessionRef.current.mute("audio") : sessionRef.current.unmute("audio");
//     }
//   };

//   const toggleMuteVideo = () => {
//     const newState = !isMutedVideo;
//     setIsMutedVideo(newState);

//     // Update hardware track directly
//     if (localStreamRef.current) {
//       localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !newState);
//     }
//     // Update session
//     if (sessionRef.current) {
//       newState ? sessionRef.current.mute("video") : sessionRef.current.unmute("video");
//     }
//   };

//   const endCall = () => {
//     if (sessionRef.current) sessionRef.current.stop({});
//     navigate(-1);
//   };

//   if (error) {
//     return <div className="error-screen"><h2>{error}</h2><button onClick={() => navigate(-1)}>Back</button></div>;
//   }

//   return (
//     <div className="video-call-page">
//       {/* 1. Lobby Overlay */}
//       {showLobby && (
//         <div className="lobby-overlay">
//           <div className="lobby-card">
//             <h2>Prepare for Class</h2>
//             <p>Subject: {booking.subject}</p>
//             <div className="lobby-preview-controls">
//               <button onClick={() => setIsMutedAudio(!isMutedAudio)} className="control-btn lobby-btn">
//                 {isMutedAudio ? <FaMicrophoneSlash className="red-icon" /> : <FaMicrophone />}
//                 <span>Audio {isMutedAudio ? "Off" : "On"}</span>
//               </button>
//               <button onClick={() => setIsMutedVideo(!isMutedVideo)} className="control-btn lobby-btn">
//                 {isMutedVideo ? <FaVideoSlash className="red-icon" /> : <FaVideo />}
//                 <span>Video {isMutedVideo ? "Off" : "On"}</span>
//               </button>
//             </div>

//             {isTutor ? (
//               <button className="join-btn" onClick={startCall}>Start Class</button>
//             ) : (
//               <button
//                 className="join-btn"
//                 onClick={joinCall}
//                 disabled={callState !== "ringing"}
//               >
//                 {callState === "ringing" ? "Join Class Now" : "Waiting for Tutor..."}
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {/* 2. Main Call Video Container */}
//       <div className="video-container" ref={videoContainerRef}>
//         <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline className="remote-video" />
//         <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline className="local-video" />

//         {callState === "ringing" && isTutor && (
//           <div className="status-overlay"><h3>Calling student...</h3></div>
//         )}
//       </div>

//       {/* 3. Footer & Controls (Visible only after joining) */}
//       {!showLobby && (
//         <>
//           <footer className="call-footer">
//             <h2>{booking.subject}</h2>
//             <span className={`call-status ${callState}`}>{callState.toUpperCase()}</span>
//           </footer>

//           <div className="controls">
//             <button onClick={toggleMuteAudio} className="control-btn">
//               {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
//             </button>
//             <button onClick={toggleMuteVideo} className="control-btn">
//               {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
//             </button>
//             <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn ${showWhiteboard ? "active" : ""}`}>
//               <FaChalkboard />
//             </button>
//             <button onClick={endCall} className="control-btn end-btn"><FaPhoneSlash /></button>
//           </div>
//         </>
//       )}

//       {/* Whiteboard */}
//       <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
//         <button className="close-whiteboard-btn" onClick={() => setShowWhiteboard(false)}>&times;</button>
//         <Excalidraw
//           excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }}
//           theme="light"
//         />
//       </div>
//     </div>
//   );
// };

// export default VideoCall;
