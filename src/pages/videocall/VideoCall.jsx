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
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  const firestoreUnsubscribeRef = useRef(null);

  if (!booking) {
    return <div className="error-screen">No booking data provided.</div>;
  }

  const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
  const opponentUser = isTutor
    ? booking.studentId || {}
    : booking.tutorId || {};

  const userId = parseInt(currentUser.cb_id);
  const password = currentUser.email;

  const clearAllTimers = () => {
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
  };

  // Helper to start the tracking logic once the session is "Live"
  const initiateSessionTracking = () => {
    startClassJoin(booking._id);
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    updateIntervalRef.current = setInterval(
      () => updateClassJoin(booking._id),
      60000,
    );
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

        if (!ConnectyCube.session) {
          await ConnectyCube.createSession({
            login: currentUser.email,
            password,
          });
        }

        if (!ConnectyCube.chat.isConnected) {
          await ConnectyCube.chat.connect({ userId, password });
        }

        // This listener usually triggers UI transitions, but since we want NO permission,
        // we won't rely on the 'stream' event to start the call UI.
        ConnectyCube.videochat.onRemoteStreamListener = (
          callSession,
          userID,
          remoteStream,
        ) => {
          remoteStreamRef.current = remoteStream;
          callSession.attachMediaStream("remoteVideo", remoteStream);
        };

        ConnectyCube.videochat.onCallListener = (callSession, extension) => {
          if (!isMountedRef.current) return;
          sessionRef.current = callSession;
          if (!isTutor) {
            // STUDENT SIDE: Accept immediately and enter the room
            callSession.accept({});
            setCallState("active");
            initiateSessionTracking();
          }
        };

        ConnectyCube.videochat.onUserNotAnswerListener = () => {
          if (isMountedRef.current) {
            setError("No answer");
            setCallState("ended");
          }
        };
        ConnectyCube.videochat.onRejectCallListener = () => {
          if (isMountedRef.current) {
            setError("Call rejected");
            setCallState("ended");
          }
        };
        ConnectyCube.videochat.onStopCallListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };

        if (isTutor) {
          startCall();
        } else {
          setCallState("waiting");
        }
      } catch (authError) {
        setError("Connection failed.");
        setCallState("ended");
      }
    };

    initSDK();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      if (sessionRef.current) sessionRef.current.stop({});
      if (ConnectyCube.chat.isConnected) ConnectyCube.chat.disconnect();
      if (firestoreUnsubscribeRef.current) firestoreUnsubscribeRef.current();
    };
  }, [isTutor, booking._id]);

  useEffect(() => {
    if (!isExcalidrawReady || !booking._id || !excalidrawApiRef.current) return;
    const handleRemoteUpdate = (data) => {
      if (
        !isMountedRef.current ||
        !data ||
        data.lastUpdatedBy === currentUser.cb_id
      )
        return;
      isUpdatingFromRemoteRef.current = true;
      if (data.elements && typeof data.elements === "string") {
        try {
          const incomingElements = JSON.parse(data.elements);
          excalidrawApiRef.current.updateScene({ elements: incomingElements });
        } catch (e) {
          console.error(e);
        }
      }
    };
    firestoreUnsubscribeRef.current = listenToWhiteboard(
      booking._id,
      currentUser.cb_id,
      opponentUser.cb_id,
      handleRemoteUpdate,
    );
  }, [isExcalidrawReady, booking._id]);

  const startCall = () => {
    if (!isMountedRef.current) return;
    const calleesIds = [parseInt(opponentUser.cb_id)];
    const sessionType = ConnectyCube.videochat.CallType.VIDEO;
    const newSession = ConnectyCube.videochat.createNewSession(
      calleesIds,
      sessionType,
      {},
    );
    sessionRef.current = newSession;

    // TUTOR SIDE: Initiate call and jump directly to active state without waiting for media
    newSession.call({ bookingId: booking._id });
    setCallState("active");
    initiateSessionTracking();
  };

  const toggleMuteAudio = () => {
    if (!sessionRef.current) return;
    setIsMutedAudio((prev) => {
      const s = !prev;
      s ? sessionRef.current.mute("audio") : sessionRef.current.unmute("audio");
      return s;
    });
  };

  const toggleMuteVideo = () => {
    if (!sessionRef.current) return;
    setIsMutedVideo((prev) => {
      const s = !prev;
      s ? sessionRef.current.mute("video") : sessionRef.current.unmute("video");
      return s;
    });
  };

  const endCall = () => {
    if (callState === "active") updateClassJoin(booking._id);
    if (sessionRef.current) sessionRef.current.stop({});
    navigate(-1);
  };

  const swapVideos = () => setIsSwapped((prev) => !prev);
  const toggleFullScreen = () => {
    if (!isFullScreen) videoContainerRef.current?.requestFullscreen();
    else document.exitFullscreen();
    setIsFullScreen(!isFullScreen);
  };

  const handleWhiteboardChange = (elements) => {
    if (isUpdatingFromRemoteRef.current) {
      isUpdatingFromRemoteRef.current = false;
      return;
    }
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
          <h2>Waiting for session to start</h2>
          <button onClick={() => navigate(-1)} className="back-btn">
            Back
          </button>
        </div>
      </div>
    );
  }

  if (callState === "ended" || error) {
    return (
      <div className="error-screen">
        <h2>{error || "Call Ended"}</h2>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="video-call-page">
      <div className="video-container" ref={videoContainerRef}>
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
        />
      </div>

      <div
        className={`whiteboard-container ${showWhiteboard ? "visible" : ""}`}
      >
        <button
          className="close-whiteboard-btn"
          onClick={() => setShowWhiteboard(false)}
        >
          &times;
        </button>
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawApiRef.current = api;
            setIsExcalidrawReady(true);
          }}
          onChange={handleWhiteboardChange}
          theme="light"
        />
      </div>

      <footer className="call-footer">
        <h2>{booking.subject}</h2>
        <span className={`call-status active`}>LIVE SESSION</span>
      </footer>

      <div className="controls">
        <button onClick={toggleMuteAudio} className="control-btn">
          {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={toggleMuteVideo} className="control-btn">
          {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button
          onClick={() => setShowWhiteboard(!showWhiteboard)}
          className="control-btn"
        >
          <FaChalkboard />
        </button>
        <button onClick={endCall} className="control-btn end-btn">
          <FaPhoneSlash />
        </button>
        <button onClick={toggleFullScreen} className="control-btn">
          {isFullScreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
