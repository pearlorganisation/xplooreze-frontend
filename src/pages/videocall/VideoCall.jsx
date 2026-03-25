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
  const remoteStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const isMountedRef = useRef(true);

  const updateIntervalRef = useRef(null);

  // --- UI State ---
  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [isMutedVideo, setIsMutedVideo] = useState(false);
  const [showLobby, setShowLobby] = useState(true);
  const [callState, setCallState] = useState("connecting");
  const [error, setError] = useState("");

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const excalidrawApiRef = useRef(null);
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);

  if (!booking) {
    return <div className="error-screen">No booking data provided.</div>;
  }

  const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
  const opponentUser = isTutor ? booking.studentId || {} : booking.tutorId || {};

  const userId = parseInt(currentUser.cb_id);
  const password = currentUser.email;

  // --- Helper: Apply Media Settings to Stream and Session ---
  const applyMediaSettings = (session, stream) => {
    if (!stream) return;

    // 1. Manually disable hardware tracks based on current lobby state
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMutedAudio;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !isMutedVideo;
    });

    // 2. Tell ConnectyCube session to mute
    if (isMutedAudio) session.mute("audio");
    if (isMutedVideo) session.mute("video");
  };

  const stopLocalStream = (stream) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initSDK = async () => {
      try {
        const CREDENTIALS = {
          appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID),
          authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY,
        };
        ConnectyCube.init(CREDENTIALS);

        if (!ConnectyCube.session) {
          await ConnectyCube.createSession({ login: currentUser.email, password });
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
          }
        };

        ConnectyCube.videochat.onCallListener = (callSession) => {
          if (!isMountedRef.current) return;
          sessionRef.current = callSession;
          if (!isTutor) {
            setCallState("ringing"); // Student is being called
          }
        };

        ConnectyCube.videochat.onStopCallListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };

        if (isTutor) {
          setCallState("ready"); // Tutor is ready to initiate
        } else {
          setCallState("waiting"); // Student waits for tutor
        }

      } catch (authError) {
        setError("Connection failed. Please refresh.");
        setCallState("ended");
      }
    };

    initSDK();

    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      stopLocalStream(localStreamRef.current);
      if (sessionRef.current) sessionRef.current.stop({});
      if (ConnectyCube.chat.isConnected) ConnectyCube.chat.disconnect();
    };
  }, []);

  // --- Tutor Starts Call ---
  const startCall = async () => {
    try {
      setShowLobby(false);
      setCallState("connecting");

      const calleesIds = [parseInt(opponentUser.cb_id)];
      const session = ConnectyCube.videochat.createNewSession(calleesIds, ConnectyCube.videochat.CallType.VIDEO);
      sessionRef.current = session;

      const stream = await session.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;

      // Apply Mute/Unmute BEFORE calling
      applyMediaSettings(session, stream);

      session.attachMediaStream("localVideo", stream, { muted: true });
      session.call({ bookingId: booking._id }, (error) => {
        if (error) {
          setError("Failed to start call.");
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

  // --- Student Joins Call ---
  const joinCall = async () => {
    try {
      setShowLobby(false);
      const session = sessionRef.current;

      const stream = await session.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;

      // Apply Mute/Unmute BEFORE accepting
      applyMediaSettings(session, stream);

      session.attachMediaStream("localVideo", stream, { muted: true });
      session.accept({});
      setCallState("active");
    } catch (err) {
      setError("Media error.");
      setCallState("ended");
    }
  };

  const toggleMuteAudio = () => {
    const newState = !isMutedAudio;
    setIsMutedAudio(newState);

    // Update hardware track directly
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !newState);
    }
    // Update session
    if (sessionRef.current) {
      newState ? sessionRef.current.mute("audio") : sessionRef.current.unmute("audio");
    }
  };

  const toggleMuteVideo = () => {
    const newState = !isMutedVideo;
    setIsMutedVideo(newState);

    // Update hardware track directly
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !newState);
    }
    // Update session
    if (sessionRef.current) {
      newState ? sessionRef.current.mute("video") : sessionRef.current.unmute("video");
    }
  };

  const endCall = () => {
    if (sessionRef.current) sessionRef.current.stop({});
    navigate(-1);
  };

  if (error) {
    return <div className="error-screen"><h2>{error}</h2><button onClick={() => navigate(-1)}>Back</button></div>;
  }

  return (
    <div className="video-call-page">
      {/* 1. Lobby Overlay */}
      {showLobby && (
        <div className="lobby-overlay">
          <div className="lobby-card">
            <h2>Prepare for Class</h2>
            <p>Subject: {booking.subject}</p>
            <div className="lobby-preview-controls">
              <button onClick={() => setIsMutedAudio(!isMutedAudio)} className="control-btn lobby-btn">
                {isMutedAudio ? <FaMicrophoneSlash className="red-icon" /> : <FaMicrophone />}
                <span>Audio {isMutedAudio ? "Off" : "On"}</span>
              </button>
              <button onClick={() => setIsMutedVideo(!isMutedVideo)} className="control-btn lobby-btn">
                {isMutedVideo ? <FaVideoSlash className="red-icon" /> : <FaVideo />}
                <span>Video {isMutedVideo ? "Off" : "On"}</span>
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
                {callState === "ringing" ? "Join Class Now" : "Waiting for Tutor..."}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Call Video Container */}
      <div className="video-container" ref={videoContainerRef}>
        <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline className="remote-video" />
        <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline className="local-video" />

        {callState === "ringing" && isTutor && (
          <div className="status-overlay"><h3>Calling student...</h3></div>
        )}
      </div>

      {/* 3. Footer & Controls (Visible only after joining) */}
      {!showLobby && (
        <>
          <footer className="call-footer">
            <h2>{booking.subject}</h2>
            <span className={`call-status ${callState}`}>{callState.toUpperCase()}</span>
          </footer>

          <div className="controls">
            <button onClick={toggleMuteAudio} className="control-btn">
              {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button onClick={toggleMuteVideo} className="control-btn">
              {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
            </button>
            <button onClick={() => setShowWhiteboard(!showWhiteboard)} className={`control-btn ${showWhiteboard ? "active" : ""}`}>
              <FaChalkboard />
            </button>
            <button onClick={endCall} className="control-btn end-btn"><FaPhoneSlash /></button>
          </div>
        </>
      )}

      {/* Whiteboard */}
      <div className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}>
        <button className="close-whiteboard-btn" onClick={() => setShowWhiteboard(false)}>&times;</button>
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawApiRef.current = api; setIsExcalidrawReady(true); }}
          theme="light"
        />
      </div>
    </div>
  );
};

export default VideoCall;