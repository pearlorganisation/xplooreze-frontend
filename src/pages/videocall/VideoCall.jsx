import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConnectyCube from "connectycube";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./VideoCall.css";

// ... (keep your imports: startClassJoin, updateClassJoin, whiteboard-services, icons)
import { startClassJoin, updateClassJoin } from "../../data/modules/booking-module";
import { listenToWhiteboard, updateWhiteboardElements } from "./whiteboard-services";
import { FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaPhoneSlash, FaExpand, FaCompress, FaChalkboard } from "react-icons/fa";

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
  const [callState, setCallState] = useState("connecting"); // connecting, waiting, lobby, active, ended
  const [error, setError] = useState("");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  const excalidrawApiRef = useRef(null);

  const currentUser = isTutor ? booking?.tutorId || {} : booking?.studentId || {};
  const opponentUser = isTutor ? booking?.studentId || {} : booking?.tutorId || {};
  const userId = parseInt(currentUser.cb_id);
  const password = currentUser.email;

  // --- Helper: Apply Media Settings ---
  const applyMediaSettings = (session) => {
    if (isMutedAudio) session.mute("audio");
    else session.unmute("audio");
    if (isMutedVideo) session.mute("video");
    else session.unmute("video");
  };

  // --- Initialize Local Preview (Lobby) ---
  const initLocalPreview = async () => {
    try {
      const mediaParams = { audio: true, video: true };
      const stream = await ConnectyCube.videochat.getUserMedia(mediaParams);
      localStreamRef.current = stream;

      // Attach to local video element immediately so user can see themselves
      if (localVideoRef.current) {
        ConnectyCube.videochat.attachMediaStream("localVideo", stream, { muted: true });
      }

      // If we already have a session, apply the track states
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMutedAudio);
        localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isMutedVideo);
      }
    } catch (err) {
      console.error("Local preview error:", err);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initSDK = async () => {
      try {
        ConnectyCube.init({
          appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID || "0"),
          authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY || "",
        });

        if (!ConnectyCube.session) await ConnectyCube.createSession({ login: currentUser.email, password });
        if (!ConnectyCube.chat.isConnected) await ConnectyCube.chat.connect({ userId, password });

        // LISTENER: Remote Stream
        ConnectyCube.videochat.onRemoteStreamListener = (callSession, userID, remoteStream) => {
          remoteStreamRef.current = remoteStream;
          callSession.attachMediaStream("remoteVideo", remoteStream);
          setCallState("active");
          startClassJoin(booking._id);
        };

        // LISTENER: Incoming Call
        ConnectyCube.videochat.onCallListener = (callSession) => {
          sessionRef.current = callSession;
          if (!isTutor) {
            setCallState("lobby"); // Trigger the Lobby UI for student
            initLocalPreview();    // Start camera preview
          }
        };

        // Other listeners (Stop, Reject, etc.)
        ConnectyCube.videochat.onStopCallListener = () => {
          setCallState("ended");
          stopLocalStream();
        };

        if (isTutor) {
          setCallState("lobby"); // Tutor also starts in lobby
          initLocalPreview();
        } else {
          setCallState("waiting"); // Student waits for tutor's call
        }
      } catch (err) {
        setError("Connection failed.");
      }
    };

    initSDK();
    return () => {
      isMountedRef.current = false;
      stopLocalStream();
      if (sessionRef.current) sessionRef.current.stop({});
    };
  }, []);

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  // --- Action: Start/Join Call ---
  const handleJoinCall = async () => {
    if (isTutor) {
      // Tutor Initiates
      const calleesIds = [parseInt(opponentUser.cb_id)];
      const session = ConnectyCube.videochat.createNewSession(calleesIds, ConnectyCube.videochat.CallType.VIDEO);
      sessionRef.current = session;

      applyMediaSettings(session);
      session.call({ bookingId: booking._id }, (err) => {
        if (!err) setCallState("ringing");
      });
      // Attach existing local stream to the session
      session.attachMediaStream("localVideo", localStreamRef.current, { muted: true });
    } else {
      // Student Accepts
      if (sessionRef.current) {
        applyMediaSettings(sessionRef.current);
        sessionRef.current.accept({});
        setCallState("active");
      }
    }
  };

  const toggleMuteAudio = () => {
    const newState = !isMutedAudio;
    setIsMutedAudio(newState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !newState);
    }
    if (sessionRef.current) {
      newState ? sessionRef.current.mute("audio") : sessionRef.current.unmute("audio");
    }
  };

  const toggleMuteVideo = () => {
    const newState = !isMutedVideo;
    setIsMutedVideo(newState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !newState);
    }
    if (sessionRef.current) {
      newState ? sessionRef.current.mute("video") : sessionRef.current.unmute("video");
    }
  };

  // --- RENDER LOGIC ---

  // 1. Waiting for call (Student only)
  if (callState === "waiting" && !isTutor) {
    return (
      <div className="waiting-screen">
        <h2>Waiting for tutor to start session...</h2>
        <button onClick={() => navigate(-1)}>Cancel</button>
      </div>
    );
  }

  // 2. Lobby Screen (Before entering class)
  if (callState === "lobby" || callState === "ringing") {
    return (
      <div className="lobby-screen">
        <div className="lobby-content">
          <h1>{isTutor ? "Start Your Class" : "Tutor is Ready!"}</h1>
          <div className="preview-container">
            <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline />
            <div className="preview-controls">
              <button onClick={toggleMuteAudio} className={`control-btn ${isMutedAudio ? "muted" : ""}`}>
                {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              <button onClick={toggleMuteVideo} className={`control-btn ${isMutedVideo ? "muted" : ""}`}>
                {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
              </button>
            </div>
          </div>
          <button className="join-btn" onClick={handleJoinCall} disabled={callState === "ringing"}>
            {callState === "ringing" ? "Calling..." : "Enter Class Now"}
          </button>
        </div>
      </div>
    );
  }

  // 3. Main Call Screen (Active)
  return (
    <div className="video-call-page">
      <div className="video-container" ref={videoContainerRef}>
        <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline className="remote-video" />
        <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline className="local-video-small" />
      </div>

      {/* Whiteboard Overlay */}
      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }}
          theme="light"
        />
      </div>

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
        <button onClick={() => navigate(-1)} className="control-btn end-btn">
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;