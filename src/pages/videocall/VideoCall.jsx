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
  FaPhoneSlash, FaChalkboard,
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
  const updateIntervalRef = useRef(null);

  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [isMutedVideo, setIsMutedVideo] = useState(false);
  const [showLobby, setShowLobby] = useState(true);
  const [callState, setCallState] = useState("connecting");
  const [error, setError] = useState("");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const excalidrawApiRef = useRef(null);

  if (!booking) return <div className="error-screen">No booking data provided.</div>;

  const currentUser = isTutor ? booking.tutorId : booking.studentId;
  const opponentUser = isTutor ? booking.studentId : booking.tutorId;

  // Sync Hardware Tracks
  const applyMediaSettings = (session, stream) => {
    if (!stream) return;
    stream.getAudioTracks().forEach(t => t.enabled = !isMutedAudio);
    stream.getVideoTracks().forEach(t => t.enabled = !isMutedVideo);
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

        if (!ConnectyCube.session) await ConnectyCube.createSession({ login: currentUser.email, password: currentUser.email });
        if (!ConnectyCube.chat.isConnected) await ConnectyCube.chat.connect({ userId: parseInt(currentUser.cb_id), password: currentUser.email });

        // IMPORTANT: Attach remote stream using Ref
        ConnectyCube.videochat.onRemoteStreamListener = (session, userID, remoteStream) => {
          remoteStreamRef.current = remoteStream;
          if (remoteVideoRef.current) {
            session.attachMediaStream(remoteVideoRef.current, remoteStream);
          }
          setCallState("active");
          startClassJoin(booking._id);
          updateIntervalRef.current = setInterval(() => updateClassJoin(booking._id), 60000);
        };

        ConnectyCube.videochat.onCallListener = (callSession) => {
          sessionRef.current = callSession;
          if (!isTutor) setCallState("ringing");
        };

        ConnectyCube.videochat.onStopCallListener = () => { if (isMountedRef.current) setCallState("ended"); };

        setCallState(isTutor ? "ready" : "waiting");
      } catch (err) { setError("Connection failed."); }
    };

    initSDK();
    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (sessionRef.current) sessionRef.current.stop({});
    };
  }, []);

  const startCall = async () => {
    try {
      setShowLobby(false);
      const session = ConnectyCube.videochat.createNewSession([parseInt(opponentUser.cb_id)], ConnectyCube.videochat.CallType.VIDEO);
      sessionRef.current = session;
      const stream = await session.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      applyMediaSettings(session, stream);
      session.attachMediaStream(localVideoRef.current, stream, { muted: true });
      session.call({ bookingId: booking._id }, (err) => { if (err) setError("Call failed"); else setCallState("ringing"); });
    } catch (e) { setError("Camera access denied"); }
  };

  const joinCall = async () => {
    try {
      setShowLobby(false);
      const stream = await sessionRef.current.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      applyMediaSettings(sessionRef.current, stream);
      sessionRef.current.attachMediaStream(localVideoRef.current, stream, { muted: true });
      sessionRef.current.accept({});
      setCallState("active");
    } catch (e) { setError("Camera access denied"); }
  };

  const toggleMute = (type) => {
    if (type === 'audio') {
      const s = !isMutedAudio; setIsMutedAudio(s);
      if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !s);
      if (sessionRef.current) s ? sessionRef.current.mute("audio") : sessionRef.current.unmute("audio");
    } else {
      const s = !isMutedVideo; setIsMutedVideo(s);
      if (localStreamRef.current) localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !s);
      if (sessionRef.current) s ? sessionRef.current.mute("video") : sessionRef.current.unmute("video");
    }
  };

  return (
    <div className="video-call-page">
      {showLobby && (
        <div className="lobby-overlay">
          <div className="lobby-card">
            <h2>{isTutor ? "Start Your Class" : "Tutor is Ready"}</h2>
            <div className="lobby-preview-controls">
              <button onClick={() => toggleMute('audio')} className="control-btn">
                {isMutedAudio ? <FaMicrophoneSlash className="red-icon" /> : <FaMicrophone />}
              </button>
              <button onClick={() => toggleMute('video')} className="control-btn">
                {isMutedVideo ? <FaVideoSlash className="red-icon" /> : <FaVideo />}
              </button>
            </div>
            {isTutor ? <button className="join-btn" onClick={startCall}>Start Class</button> :
              <button className="join-btn" onClick={joinCall} disabled={callState !== "ringing"}>
                {callState === "ringing" ? "Join Now" : "Waiting..."}</button>}
          </div>
        </div>
      )}

      <div className="main-video-area">
        <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
        <video ref={localVideoRef} className="local-video" autoPlay muted playsInline />
      </div>

      {!showLobby && (
        <div className="bottom-controls">
          <button onClick={() => toggleMute('audio')} className="control-btn">
            {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button onClick={() => toggleMute('video')} className="control-btn">
            {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
          </button>
          <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn ${showWhiteboard ? 'active' : ''}`}>
            <FaChalkboard />
          </button>
          <button onClick={() => navigate(-1)} className="control-btn end-btn"><FaPhoneSlash /></button>
        </div>
      )}

      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <Excalidraw theme="light" />
      </div>
    </div>
  );
};

export default VideoCall;