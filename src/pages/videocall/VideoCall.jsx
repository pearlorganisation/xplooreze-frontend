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

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const isMountedRef = useRef(true);

  // --- UI State ---
  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [isMutedVideo, setIsMutedVideo] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [showLobby, setShowLobby] = useState(true); // Lobby is visible by default
  const [error, setError] = useState("");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  const excalidrawApiRef = useRef(null);

  if (!booking) return <div className="error-screen">No booking data.</div>;

  const currentUser = isTutor ? booking.tutorId : booking.studentId;
  const opponentUser = isTutor ? booking.studentId : booking.tutorId;
  const userId = parseInt(currentUser.cb_id);
  const password = currentUser.email;

  // --- Functions from your working version ---
  const stopLocalStream = (stream) => stream?.getTracks().forEach((t) => t.stop());

  const applyInitialMediaState = (session) => {
    if (isMutedAudio) session.mute("audio");
    if (isMutedVideo) session.mute("video");
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initSDK = async () => {
      try {
        ConnectyCube.init({
          appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID),
          authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY,
        });

        if (!ConnectyCube.session) await ConnectyCube.createSession({ login: currentUser.email, password });
        if (!ConnectyCube.chat.isConnected) await ConnectyCube.chat.connect({ userId, password });

        ConnectyCube.videochat.onRemoteStreamListener = (session, userID, remoteStream) => {
          remoteStreamRef.current = remoteStream;
          session.attachMediaStream("remoteVideo", remoteStream);
          setCallState("active");
          startClassJoin(booking._id);
        };

        ConnectyCube.videochat.onCallListener = async (callSession) => {
          sessionRef.current = callSession;
          if (!isTutor) {
            // FOR STUDENT: Don't accept yet. Show lobby.
            setCallState("ringing");
          }
        };

        ConnectyCube.videochat.onStopCallListener = () => { if (isMountedRef.current) setCallState("ended"); };

        if (isTutor) {
          setCallState("ready"); // Tutor is ready to click "Start"
        } else {
          setCallState("waiting"); // Student waits for tutor
        }
      } catch (err) {
        setError("Connection failed.");
      }
    };

    initSDK();
    return () => {
      isMountedRef.current = false;
      stopLocalStream(localStreamRef.current);
      if (sessionRef.current) sessionRef.current.stop({});
    };
  }, []);

  // --- Tutor Starts Call ---
  const startCall = async () => {
    try {
      setShowLobby(false);
      const calleesIds = [parseInt(opponentUser.cb_id)];
      const session = ConnectyCube.videochat.createNewSession(calleesIds, ConnectyCube.videochat.CallType.VIDEO);
      sessionRef.current = session;

      const stream = await session.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;

      applyInitialMediaState(session);
      session.attachMediaStream("localVideo", stream, { muted: true });

      session.call({ bookingId: booking._id }, (error) => {
        if (error) setError("Failed to call");
        else setCallState("ringing");
      });
    } catch (err) { setError("Camera error"); }
  };

  // --- Student Joins Call ---
  const joinCall = async () => {
    try {
      setShowLobby(false);
      const session = sessionRef.current;
      const stream = await session.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;

      applyInitialMediaState(session);
      session.attachMediaStream("localVideo", stream, { muted: true });
      session.accept({});
      setCallState("active");
    } catch (err) { setError("Camera error"); }
  };

  const toggleMuteAudio = () => {
    const newState = !isMutedAudio;
    setIsMutedAudio(newState);
    if (sessionRef.current) {
      newState ? sessionRef.current.mute("audio") : sessionRef.current.unmute("audio");
    }
  };

  const toggleMuteVideo = () => {
    const newState = !isMutedVideo;
    setIsMutedVideo(newState);
    if (sessionRef.current) {
      newState ? sessionRef.current.mute("video") : sessionRef.current.unmute("video");
    }
  };

  // --- Render logic using overlays so the video elements don't unmount ---
  return (
    <div className="video-call-page">
      {/* 1. LOBBY OVERLAY (Student and Tutor see this before joining) */}
      {showLobby && (
        <div className="lobby-overlay">
          <div className="lobby-card">
            <h2>{isTutor ? "Start Your Class" : "Join Your Class"}</h2>
            <p>Check your camera and microphone before entering.</p>

            <div className="lobby-controls">
              <button onClick={() => setIsMutedAudio(!isMutedAudio)} className="control-btn">
                {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              <button onClick={() => setIsMutedVideo(!isMutedVideo)} className="control-btn">
                {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
              </button>
            </div>

            {isTutor ? (
              <button className="join-btn" onClick={startCall}>Start Class</button>
            ) : (
              <button
                className="join-btn"
                onClick={joinCall}
                disabled={callState !== "ringing"}
              >
                {callState === "ringing" ? "Join Now" : "Waiting for Tutor..."}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. THE CALL INTERFACE (Hidden or visible depending on state) */}
      <div className="video-container" ref={videoContainerRef}>
        <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline className="remote-video" />
        <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline className="local-video" />
      </div>

      {/* Whiteboard and regular controls (Same as your working code) */}
      {!showLobby && (
        <div className="controls">
          <button onClick={toggleMuteAudio} className="control-btn">
            {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button onClick={toggleMuteVideo} className="control-btn">
            {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
          </button>
          <button onClick={() => setShowWhiteboard(!showWhiteboard)} className="control-btn">
            <FaChalkboard />
          </button>
          <button onClick={() => navigate(-1)} className="control-btn end-btn"><FaPhoneSlash /></button>
        </div>
      )}

      {/* Whiteboard Container */}
      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <Excalidraw theme="light" excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }} />
      </div>
    </div>
  );
};

export default VideoCall;