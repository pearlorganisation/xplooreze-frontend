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

const VideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, isTutor = true } = location.state || {};

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const isMountedRef = useRef(true);
  const updateIntervalRef = useRef(null);

  // --- UI State ---
  // Start with audio and video DISABLED (false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [error, setError] = useState("");

  // Whiteboard states
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  const excalidrawApiRef = useRef(null);
  const isUpdatingFromRemoteRef = useRef(false);
  const debounceHandlerRef = useRef(null);

  if (!booking) return <div className="error-screen">No booking data provided.</div>;

  const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
  const opponentUser = isTutor ? booking.studentId || {} : booking.tutorId || {};
  const userId = parseInt(currentUser.cb_id);
  const password = currentUser.email;
  const opponentId = parseInt(opponentUser.cb_id);

  /**
   * Helper: Initialize Media only when requested
   * This is what triggers the browser permission prompt
   */
  const startMedia = async (audioRequested, videoRequested) => {
    try {
      const mediaParams = {
        audio: true, // We request both but will mute based on user choice
        video: { width: 640, height: 480 },
      };

      const stream = await sessionRef.current.getUserMedia(mediaParams);
      localStreamRef.current = stream;

      // Attach to UI
      sessionRef.current.attachMediaStream("localVideo", stream, { muted: true });

      // Apply initial mute states based on what the user clicked
      if (!audioRequested) sessionRef.current.mute("audio");
      if (!videoRequested) sessionRef.current.mute("video");

      return stream;
    } catch (err) {
      console.error("Media error:", err);
      alert("Could not access camera/microphone. Please check permissions.");
      return null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initSDK = async () => {
      try {
        const CREDENTIALS = {
          appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID || "0"),
          authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY || "",
        };
        ConnectyCube.init(CREDENTIALS);

        if (!ConnectyCube.session) await ConnectyCube.createSession({ login: currentUser.email, password });
        if (!ConnectyCube.chat.isConnected) await ConnectyCube.chat.connect({ userId, password });

        // Listen for remote stream (when the other person turns theirs on)
        ConnectyCube.videochat.onRemoteStreamListener = (session, userID, remoteStream) => {
          session.attachMediaStream("remoteVideo", remoteStream);
          if (isMountedRef.current) setCallState("active");
        };

        ConnectyCube.videochat.onCallListener = (callSession) => {
          if (!isMountedRef.current) return;
          sessionRef.current = callSession;
          if (!isTutor) {
            // STUDENT joins immediately without camera/mic
            callSession.accept({});
            setCallState("active");
            startTracking();
          }
        };

        ConnectyCube.videochat.onStopCallListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };

        if (isTutor) {
          // TUTOR starts call immediately without camera/mic
          const session = ConnectyCube.videochat.createNewSession([opponentId], ConnectyCube.videochat.CallType.VIDEO);
          sessionRef.current = session;
          session.call({ bookingId: booking._id }, (err) => {
            if (err) setError("Failed to start call");
            else {
              setCallState("active");
              startTracking();
            }
          });
        } else {
          setCallState("waiting");
        }
      } catch (err) {
        setError("Connection failed. Please refresh.");
      }
    };

    initSDK();
    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (sessionRef.current) sessionRef.current.stop({});
    };
  }, []);

  const startTracking = () => {
    startClassJoin(booking._id);
    updateIntervalRef.current = setInterval(() => updateClassJoin(booking._id), 60000);
  };

  // --- Handlers for late activation ---

  const toggleAudio = async () => {
    if (!sessionRef.current) return;

    if (!localStreamRef.current) {
      // First time click: browser will ask for permission here
      const stream = await startMedia(true, isVideoEnabled);
      if (stream) setIsAudioEnabled(true);
    } else {
      // Toggle existing track
      const nextState = !isAudioEnabled;
      setIsAudioEnabled(nextState);
      if (nextState) sessionRef.current.unmute("audio");
      else sessionRef.current.mute("audio");
    }
  };

  const toggleVideo = async () => {
    if (!sessionRef.current) return;

    if (!localStreamRef.current) {
      // First time click: browser will ask for permission here
      const stream = await startMedia(isAudioEnabled, true);
      if (stream) setIsVideoEnabled(true);
    } else {
      // Toggle existing track
      const nextState = !isVideoEnabled;
      setIsVideoEnabled(nextState);
      if (nextState) sessionRef.current.unmute("video");
      else sessionRef.current.mute("video");
    }
  };

  // --- Whiteboard & Other Utils ---

  useEffect(() => {
    if (!isExcalidrawReady || !booking._id) return;
    const unsubscribe = listenToWhiteboard(booking._id, currentUser.cb_id, opponentUser.cb_id, (data) => {
      if (!isMountedRef.current || !data || data.lastUpdatedBy === currentUser.cb_id) return;
      isUpdatingFromRemoteRef.current = true;
      if (data.elements) excalidrawApiRef.current.updateScene({ elements: JSON.parse(data.elements) });
    });
    return () => unsubscribe();
  }, [isExcalidrawReady, booking._id]);

  const endCall = () => {
    if (callState === "active") updateClassJoin(booking._id);
    navigate(-1);
  };

  if (callState === "waiting") return (
    <div className="waiting-screen">
      <h2>Waiting for tutor to join...</h2>
      <button onClick={() => navigate(-1)} className="back-btn">Back</button>
    </div>
  );

  if (callState === "ended" || error) return (
    <div className="error-screen">
      <h2>{error || "Call Ended"}</h2>
      <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
    </div>
  );

  return (
    <div className="video-call-page">
      <div className="video-container" ref={videoContainerRef}>
        <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline className={`remote-video ${isSwapped ? "small-video" : "big-video"}`} onClick={() => setIsSwapped(!isSwapped)} />

        <div className={`local-video-wrapper ${isSwapped ? "big-video" : "small-video"}`}>
          <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline onClick={() => setIsSwapped(!isSwapped)} />
          {!isVideoEnabled && <div className="video-off-placeholder">Camera Off</div>}
        </div>
      </div>

      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <button className="close-whiteboard-btn" onClick={() => setShowWhiteboard(false)}>&times;</button>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }}
          onChange={(elements) => {
            if (isUpdatingFromRemoteRef.current) { isUpdatingFromRemoteRef.current = false; return; }
            if (debounceHandlerRef.current) clearTimeout(debounceHandlerRef.current);
            debounceHandlerRef.current = setTimeout(() => updateWhiteboardElements(booking._id, elements, currentUser.cb_id), 100);
          }}
        />
      </div>

      <div className="controls">
        <button onClick={toggleAudio} className={`control-btn ${!isAudioEnabled ? "muted" : ""}`}>
          {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button onClick={toggleVideo} className={`control-btn ${!isVideoEnabled ? "muted" : ""}`}>
          {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </button>
        <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn ${showWhiteboard ? "active" : ""}`}>
          <FaChalkboard />
        </button>
        <button onClick={endCall} className="control-btn end-btn"><FaPhoneSlash /></button>
        <button onClick={() => {
          if (!isFullScreen) videoContainerRef.current.requestFullscreen();
          else document.exitFullscreen();
          setIsFullScreen(!isFullScreen);
        }} className="control-btn"><FaExpand /></button>
      </div>

      {callState === "connecting" && <div className="loading-screen"><div className="spinner"></div></div>}
    </div>
  );
};

export default VideoCall;