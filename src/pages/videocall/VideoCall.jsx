import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConnectyCube from "connectycube";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./VideoCall.css";

// --- Import class tracking API functions ---
import {
  startClassJoin,
  updateClassJoin,
} from "../../data/modules/booking-module";

// --- Import Firestore services ---
import {
  listenToWhiteboard,
  updateWhiteboardElements,
  addWhiteboardFile,
} from "./whiteboard-services";

// Icons
import {
  FaVideo,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideoSlash,
  FaPhoneSlash,
  FaExpand,
  FaCompress,
  FaChalkboard,
} from "react-icons/fa";

const getBookingDurationInMs = (booking) => {
  try {
    const [startHour, startMin] = booking.startTime.split(":").map(Number);
    const [endHour, endMin] = booking.endTime.split(":").map(Number);
    const totalStartMinutes = startHour * 60 + startMin;
    const totalEndMinutes = endHour * 60 + endMin;
    const durationInMinutes = totalEndMinutes - totalStartMinutes;
    if (durationInMinutes <= 0) return null;
    return durationInMinutes * 60 * 1000;
  } catch (e) {
    console.error("Error calculating booking duration:", e);
    return null;
  }
};

const VideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, isTutor = true } = location.state || {};

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const isMountedRef = useRef(true);

  const updateIntervalRef = useRef(null);
  const bookingEndTimerRef = useRef(null);

  // --- UI State ---
  // Defaulting to false (on), but you can set these to true to join muted by default
  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [isMutedVideo, setIsMutedVideo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [error, setError] = useState("");

  const isUpdatingFromRemoteRef = useRef(false);
  const debounceHandlerRef = useRef(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const excalidrawApiRef = useRef(null);
  const lastSentElementsRef = useRef(null);
  const lastReceivedElementsRef = useRef(null);
  const sentFilesRef = useRef(new Set());
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  const firestoreUnsubscribeRef = useRef(null);

  if (!booking) {
    return <div className="error-screen">No booking data provided.</div>;
  }

  const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
  const opponentUser = isTutor ? booking.studentId || {} : booking.tutorId || {};

  const userId = parseInt(currentUser.cb_id);
  const opponentId = parseInt(opponentUser.cb_id);
  const login = currentUser.email;
  const password = currentUser.email;

  const stopLocalStream = (stream) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };
  const stopRemoteStream = (stream) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const clearAllTimers = () => {
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    if (bookingEndTimerRef.current) clearTimeout(bookingEndTimerRef.current);
  };

  /**
   * Helper to apply current mute/video state to the session
   */
  const applyInitialMediaState = (session) => {
    if (isMutedAudio) session.mute("audio");
    if (isMutedVideo) session.mute("video");
  };

  useEffect(() => {
    isMountedRef.current = true;
    const originalListeners = {
      onRemoteStreamListener: ConnectyCube.videochat?.onRemoteStreamListener || null,
      onCallListener: ConnectyCube.videochat?.onCallListener || null,
      onUserNotAnswerListener: ConnectyCube.videochat?.onUserNotAnswerListener || null,
      onRejectCallListener: ConnectyCube.videochat?.onRejectCallListener || null,
      onStopCallListener: ConnectyCube.videochat?.onStopCallListener || null,
      onDisconnectedListener: ConnectyCube.chat?.onDisconnectedListener || null,
    };

    const initSDK = async () => {
      try {
        const CREDENTIALS = {
          appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID || "0"),
          authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY || "",
        };
        ConnectyCube.init(CREDENTIALS);

        if (!ConnectyCube.session) {
          await ConnectyCube.createSession({ login, password });
        }

        if (!ConnectyCube.chat.isConnected) {
          await ConnectyCube.chat.connect({ userId, password });
        }

        ConnectyCube.videochat.onRemoteStreamListener = (callSession, userID, remoteStream) => {
          remoteStreamRef.current = remoteStream;
          callSession.attachMediaStream("remoteVideo", remoteStream);
          if (isMountedRef.current) {
            setCallState("active");
            startClassJoin(booking._id);
            updateIntervalRef.current = setInterval(() => updateClassJoin(booking._id), 60000);

            if (isTutor) {
              const durationInMs = getBookingDurationInMs(booking);
              if (durationInMs) {
                bookingEndTimerRef.current = setTimeout(() => {
                  alert("The scheduled class time has ended.");
                }, durationInMs);
              }
            }
          }
        };

        ConnectyCube.videochat.onCallListener = async (callSession) => {
          if (!isMountedRef.current) return;
          sessionRef.current = callSession;

          if (!isTutor) {
            setCallState("connecting");
            try {
              const mediaParams = { audio: true, video: true };
              const localStream = await callSession.getUserMedia(mediaParams);
              localStreamRef.current = localStream;

              // Apply existing toggle states before attaching
              applyInitialMediaState(callSession);

              callSession.attachMediaStream("localVideo", localStream, { muted: true });
              callSession.accept({});
            } catch (err) {
              console.error("Error accepting call:", err);
              // Fallback: Try audio only if video fails
              try {
                const audioStream = await callSession.getUserMedia({ audio: true, video: false });
                localStreamRef.current = audioStream;
                applyInitialMediaState(callSession);
                callSession.attachMediaStream("localVideo", audioStream, { muted: true });
                callSession.accept({});
              } catch (innerErr) {
                setError("Media devices not found. Please check permissions.");
                setCallState("ended");
                callSession.reject({});
              }
            }
          } else {
            setCallState("ringing");
          }
        };

        ConnectyCube.videochat.onUserNotAnswerListener = () => {
          if (isMountedRef.current) { setError("Opponent did not answer"); setCallState("ended"); }
        };

        ConnectyCube.videochat.onRejectCallListener = () => {
          if (isMountedRef.current) { setError("Call rejected"); setCallState("ended"); }
        };

        ConnectyCube.videochat.onStopCallListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };

        if (isTutor) startCall();
        else setCallState("waiting");

      } catch (authError) {
        setError("Connection failed. Please refresh.");
        setCallState("ended");
      }
    };

    initSDK();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      Object.keys(originalListeners).forEach(key => {
        if (originalListeners[key]) ConnectyCube.videochat[key] = originalListeners[key];
      });
      stopLocalStream(localStreamRef.current);
      stopRemoteStream(remoteStreamRef.current);
      if (sessionRef.current) sessionRef.current.stop({});
      if (ConnectyCube.chat.isConnected) ConnectyCube.chat.disconnect();
    };
  }, [isTutor, booking._id]);

  // --- Whiteboard Effect ---
  useEffect(() => {
    if (!isExcalidrawReady || !booking._id || !excalidrawApiRef.current) return;
    const handleRemoteUpdate = (data) => {
      if (!isMountedRef.current || !data || data.lastUpdatedBy === currentUser.cb_id) return;
      isUpdatingFromRemoteRef.current = true;
      if (data.elements && typeof data.elements === "string") {
        const incomingElements = JSON.parse(data.elements);
        const existingElements = excalidrawApiRef.current.getSceneElements();
        const mergedElementsMap = new Map(existingElements.map((el) => [el.id, el]));
        incomingElements.forEach((incomingEl) => {
          const existingEl = mergedElementsMap.get(incomingEl.id);
          if (!existingEl || incomingEl.version > existingEl.version) {
            mergedElementsMap.set(incomingEl.id, incomingEl);
          }
        });
        excalidrawApiRef.current.updateScene({ elements: Array.from(mergedElementsMap.values()) });
      }
      if (data.files) excalidrawApiRef.current.addFiles(data.files);
    };
    const unsubscribe = listenToWhiteboard(booking._id, currentUser.cb_id, opponentUser.cb_id, handleRemoteUpdate);
    firestoreUnsubscribeRef.current = unsubscribe;
    return () => unsubscribe();
  }, [isExcalidrawReady, booking._id]);

  const startCall = async () => {
    try {
      if (isMountedRef.current) setCallState("connecting");
      const calleesIds = [opponentId];
      const sessionType = ConnectyCube.videochat.CallType.VIDEO;
      const newSession = ConnectyCube.videochat.createNewSession(calleesIds, sessionType, {});
      sessionRef.current = newSession;

      const mediaParams = { audio: true, video: true };
      let localStream;
      try {
        localStream = await newSession.getUserMedia(mediaParams);
      } catch (e) {
        // Fallback to audio only if user doesn't have a camera
        localStream = await newSession.getUserMedia({ audio: true, video: false });
      }

      localStreamRef.current = localStream;

      // Apply existing toggle states immediately
      applyInitialMediaState(newSession);

      newSession.attachMediaStream("localVideo", localStream, { muted: true });
      newSession.call({ bookingId: booking._id }, (error) => {
        if (error) {
          setError("Failed to initiate call.");
          setCallState("ended");
        } else {
          setCallState("ringing");
        }
      });
    } catch (err) {
      setError("Could not access camera/microphone.");
      setCallState("ended");
    }
  };

  const toggleMuteAudio = () => {
    if (!sessionRef.current) {
      setIsMutedAudio(!isMutedAudio);
      return;
    }
    const newState = !isMutedAudio;
    setIsMutedAudio(newState);
    if (newState) sessionRef.current.mute("audio");
    else sessionRef.current.unmute("audio");
  };

  const toggleMuteVideo = () => {
    if (!sessionRef.current) {
      setIsMutedVideo(!isMutedVideo);
      return;
    }
    const newState = !isMutedVideo;
    setIsMutedVideo(newState);
    if (newState) sessionRef.current.mute("video");
    else sessionRef.current.unmute("video");
  };

  const endCall = () => {
    clearAllTimers();
    if (callState === "active") updateClassJoin(booking._id);
    stopLocalStream(localStreamRef.current);
    if (sessionRef.current) sessionRef.current.stop({});
    navigate(-1);
  };

  const swapVideos = () => setIsSwapped(!isSwapped);
  const toggleFullScreen = () => {
    if (!isFullScreen) videoContainerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullScreen(!isFullScreen);
  };

  const handleWhiteboardChange = (elements) => {
    if (isUpdatingFromRemoteRef.current) { isUpdatingFromRemoteRef.current = false; return; }
    if (!isMountedRef.current || !showWhiteboard) return;
    if (debounceHandlerRef.current) clearTimeout(debounceHandlerRef.current);
    debounceHandlerRef.current = setTimeout(() => {
      updateWhiteboardElements(booking._id, elements, currentUser.cb_id);
    }, 100);
  };

  if (callState === "waiting") {
    return (
      <div className="waiting-screen">
        <div className="waiting-content">
          <FaVideo className="waiting-icon" />
          <h2>Waiting for tutor to start the session</h2>
          <button onClick={() => navigate(-1)} className="back-btn">Back</button>
        </div>
      </div>
    );
  }

  if (callState === "ended" || error) {
    return (
      <div className="error-screen">
        <h2>{error || "Call Ended"}</h2>
        <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
      </div>
    );
  }

  return (
    <div className="video-call-page">
      <div className="video-container" ref={videoContainerRef}>
        {callState === "ringing" && isTutor && (
          <div className="ringing-screen"><h3>Calling...</h3></div>
        )}
        <video
          ref={remoteVideoRef}
          id="remoteVideo"
          autoPlay
          playsInline
          className={`remote-video ${isSwapped ? "small-video" : "big-video"}`}
          onClick={swapVideos}
        />
        <video
          ref={localVideoRef}
          id="localVideo"
          autoPlay
          muted
          playsInline
          className={`local-video ${isSwapped ? "big-video" : "small-video"}`}
          onClick={swapVideos}
        />
      </div>

      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <button className="close-whiteboard-btn" onClick={() => setShowWhiteboard(false)}>&times;</button>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }}
          onChange={handleWhiteboardChange}
          theme="light"
        />
      </div>

      <footer className="call-footer">
        <h2>{booking.subject}</h2>
        <span className={`call-status ${callState}`}>{callState.toUpperCase()}</span>
      </footer>

      <div className="controls">
        <button onClick={toggleMuteAudio} className="control-btn audio-btn">
          {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={toggleMuteVideo} className="control-btn video-btn">
          {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
        </button>
        {callState === "active" && (
          <>
            <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn whiteboard-btn ${showWhiteboard ? "active" : ""}`}>
              <FaChalkboard />
            </button>
            <button onClick={endCall} className="control-btn end-btn"><FaPhoneSlash /></button>
            <button onClick={toggleFullScreen} className="control-btn fullscreen-btn">
              {isFullScreen ? <FaCompress /> : <FaExpand />}
            </button>
          </>
        )}
      </div>

      {callState === "connecting" && (
        <div className="loading-screen"><div className="spinner"></div><p>Connecting...</p></div>
      )}
    </div>
  );
};

export default VideoCall;