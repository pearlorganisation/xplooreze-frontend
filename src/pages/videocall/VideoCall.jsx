import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConnectyCube from "connectycube";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./VideoCall.css";

import { startClassJoin, updateClassJoin } from "../../data/modules/booking-module";
import { listenToWhiteboard, updateWhiteboardElements } from "./whiteboard-services";

import {
  FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash,
  FaPhoneSlash, FaExpand, FaCompress, FaChalkboard,
} from "react-icons/fa";

const VideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, isTutor = true } = location.state || {};

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const isMountedRef = useRef(true);
  const updateIntervalRef = useRef(null);

  // --- UI State ---
  // Start with EVERYTHING muted/off
  const [isMutedAudio, setIsMutedAudio] = useState(true);
  const [isMutedVideo, setIsMutedVideo] = useState(true);
  const [callState, setCallState] = useState("connecting");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [error, setError] = useState("");
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

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  /**
   * CORE LOGIC: Initialize media ONLY when the user clicks a button
   */
  const initMediaDevice = async (requestedAudio, requestedVideo) => {
    try {
      const mediaParams = {
        audio: requestedAudio,
        video: requestedVideo ? { width: 640, height: 480 } : false,
      };

      // This is where the browser will finally ask for permission
      const stream = await sessionRef.current.getUserMedia(mediaParams);
      localStreamRef.current = stream;

      // Attach to the video element
      sessionRef.current.attachMediaStream("localVideo", stream, { muted: true });

      return stream;
    } catch (err) {
      console.error("Media Access Denied or Not Found:", err);
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

        // Setup Listeners
        ConnectyCube.videochat.onRemoteStreamListener = (session, userID, remoteStream) => {
          session.attachMediaStream("remoteVideo", remoteStream);
          if (isMountedRef.current) setCallState("active");
        };

        ConnectyCube.videochat.onCallListener = (callSession) => {
          if (!isMountedRef.current) return;
          sessionRef.current = callSession;

          if (!isTutor) {
            // STUDENT: Accept immediately WITHOUT asking for camera/mic yet
            callSession.accept({});
            setCallState("active");
            startClassJoin(booking._id);
            updateIntervalRef.current = setInterval(() => updateClassJoin(booking._id), 60000);
          }
        };

        ConnectyCube.videochat.onStopCallListener = () => { if (isMountedRef.current) setCallState("ended"); };

        if (isTutor) {
          startSignalingCall();
        } else {
          setCallState("waiting");
        }
      } catch (err) {
        setError("Connection failed. Check your internet.");
      }
    };

    initSDK();
    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      stopLocalStream();
      if (sessionRef.current) sessionRef.current.stop({});
    };
  }, []);

  // START CALL (Tutor side - Signaling only)
  const startSignalingCall = () => {
    const session = ConnectyCube.videochat.createNewSession([opponentId], ConnectyCube.videochat.CallType.VIDEO);
    sessionRef.current = session;

    // Call without waiting for getUserMedia
    session.call({ bookingId: booking._id }, (error) => {
      if (error) setError("Failed to start call.");
      else {
        setCallState("active"); // Move to call UI immediately
        startClassJoin(booking._id);
        updateIntervalRef.current = setInterval(() => updateClassJoin(booking._id), 60000);
      }
    });
  };

  // TOGGLE AUDIO
  const toggleAudio = async () => {
    if (!sessionRef.current) return;

    if (!localStreamRef.current) {
      // First time activating media
      const stream = await initMediaDevice(true, !isMutedVideo);
      if (stream) {
        setIsMutedAudio(false);
      }
    } else {
      // Stream already exists, just toggle track
      const newState = !isMutedAudio;
      setIsMutedAudio(newState);
      if (newState) sessionRef.current.mute("audio");
      else sessionRef.current.unmute("audio");
    }
  };

  // TOGGLE VIDEO
  const toggleVideo = async () => {
    if (!sessionRef.current) return;

    if (!localStreamRef.current) {
      // First time activating media
      const stream = await initMediaDevice(!isMutedAudio, true);
      if (stream) {
        setIsMutedVideo(false);
      }
    } else {
      // Stream already exists, just toggle track
      const newState = !isMutedVideo;
      setIsMutedVideo(newState);
      if (newState) sessionRef.current.mute("video");
      else sessionRef.current.unmute("video");
    }
  };

  const endCall = () => {
    if (callState === "active") updateClassJoin(booking._id);
    navigate(-1);
  };

  // Whiteboard Logic
  useEffect(() => {
    if (!isExcalidrawReady || !booking._id) return;
    const unsubscribe = listenToWhiteboard(booking._id, currentUser.cb_id, opponentUser.cb_id, (data) => {
      if (!isMountedRef.current || !data || data.lastUpdatedBy === currentUser.cb_id) return;
      isUpdatingFromRemoteRef.current = true;
      if (data.elements) excalidrawApiRef.current.updateScene({ elements: JSON.parse(data.elements) });
    });
    return () => unsubscribe();
  }, [isExcalidrawReady, booking._id]);

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
        <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline className={`local-video ${isSwapped ? "big-video" : "small-video"}`} onClick={() => setIsSwapped(!isSwapped)} />

        {/* Visual feedback if camera is off */}
        {isMutedVideo && <div className="video-placeholder">Camera is Off</div>}
      </div>

      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <button className="close-whiteboard-btn" onClick={() => setShowWhiteboard(false)}>&times;</button>
        <Excalidraw excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }} theme="light" />
      </div>

      <footer className="call-footer">
        <h2>{booking.subject}</h2>
        <p>{booking.startTime} - {booking.endTime}</p>
      </footer>

      <div className="controls">
        <button onClick={toggleAudio} className={`control-btn ${isMutedAudio ? "muted" : ""}`}>
          {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={toggleVideo} className={`control-btn ${isMutedVideo ? "muted" : ""}`}>
          {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button onClick={() => setShowWhiteboard(!showWhiteboard)} className="control-btn">
          <FaChalkboard />
        </button>
        <button onClick={endCall} className="control-btn end-btn">
          <FaPhoneSlash />
        </button>
        <button onClick={() => {
          if (!isFullScreen) videoContainerRef.current.requestFullscreen();
          else document.exitFullscreen();
          setIsFullScreen(!isFullScreen);
        }} className="control-btn">
          {isFullScreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;