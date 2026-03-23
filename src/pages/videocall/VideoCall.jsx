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
  // addWhiteboardFile,
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

  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [isMutedVideo, setIsMutedVideo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [error, setError] = useState("");

  const isUpdatingFromRemoteRef = useRef(false);
  //s
  const debounceHandlerRef = useRef(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const excalidrawApiRef = useRef(null);
  const lastSentElementsRef = useRef(null);

  const sentFilesRef = useRef(new Set());
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  const firestoreUnsubscribeRef = useRef(null);

  if (!booking)
    return <div className="error-screen">No booking data provided.</div>;

  const currentUser = isTutor ? booking.tutorId || {} : booking.studentId || {};
  const opponentUser = isTutor
    ? booking.studentId || {}
    : booking.tutorId || {};

  if (!currentUser.cb_id || !opponentUser.cb_id || !currentUser.email) {
    return (
      <div className="error-screen">
        Missing user credentials for video call.
      </div>
    );
  }

  const userId = parseInt(currentUser.cb_id);
  const opponentId = parseInt(opponentUser.cb_id);
  const login = currentUser.email;
  const password = currentUser.email;

  const stopLocalStream = (stream) => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
  };
  const stopRemoteStream = (stream) => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
  };

  const clearAllTimers = () => {
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    if (bookingEndTimerRef.current) clearTimeout(bookingEndTimerRef.current);
  };

  const waitForFileData = (fileId, pollInterval = 100, maxAttempts = 20) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const poll = () => {
        if (!isMountedRef.current) return reject(new Error("Unmounted"));
        const files = excalidrawApiRef.current?.getFiles();
        const fileData = files ? files[fileId] : null;
        if (fileData && fileData.dataURL) resolve(fileData);
        else if (attempts >= maxAttempts)
          reject(new Error(`Timeout ${fileId}`));
        else {
          attempts++;
          setTimeout(poll, pollInterval);
        }
      };
      poll();
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    const originalListeners = {
      onRemoteStreamListener:
        ConnectyCube.videochat?.onRemoteStreamListener || null,
      onCallListener: ConnectyCube.videochat?.onCallListener || null,
      onUserNotAnswerListener:
        ConnectyCube.videochat?.onUserNotAnswerListener || null,
      onRejectCallListener:
        ConnectyCube.videochat?.onRejectCallListener || null,
      onStopCallListener: ConnectyCube.videochat?.onStopCallListener || null,
      onDisconnectedListener: ConnectyCube.chat?.onDisconnectedListener || null,
    };

    const initSDK = async () => {
      try {
        const CREDENTIALS = {
          appId: parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID || "0"),
          authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY || "",
        };
        if (CREDENTIALS.appId && CREDENTIALS.authKey)
          ConnectyCube.init(CREDENTIALS);

        if (!ConnectyCube.session)
          await ConnectyCube.createSession({ login, password });
        if (!isMountedRef.current) return;

        if (!ConnectyCube.chat.isConnected) {
          await ConnectyCube.chat.connect({ userId, password });
        }

        ConnectyCube.videochat.onRemoteStreamListener = (
          callSession,
          userID,
          remoteStream,
        ) => {
          remoteStreamRef.current = remoteStream;
          callSession.attachMediaStream("remoteVideo", remoteStream);
          if (isMountedRef.current) {
            setCallState("active");
            startClassJoin(booking._id);
            updateIntervalRef.current = setInterval(
              () => updateClassJoin(booking._id),
              60000,
            );
            if (isTutor) {
              const durationInMs = getBookingDurationInMs(booking);
              if (durationInMs) {
                bookingEndTimerRef.current = setTimeout(() => {
                  if (isMountedRef.current) alert("Class time ended.");
                }, durationInMs);
              }
            }
          }
        };

        ConnectyCube.videochat.onCallListener = async (
          callSession,
          extension,
        ) => {
          if (!isMountedRef.current) return;
          sessionRef.current = callSession;
          if (!isTutor) {
            setCallState("connecting");
            let localStream = null;
            try {
              // Try to get media, but don't fail if user denies
              localStream = await callSession.getUserMedia({
                audio: true,
                video: true,
              });
              localStreamRef.current = localStream;
              callSession.attachMediaStream("localVideo", localStream, {
                muted: true,
              });
            } catch (err) {
              console.warn("User joined without camera/mic permissions");
            }
            // Always accept the call even if stream is null
            callSession.accept({});
          } else {
            setCallState("ringing");
          }
        };

        ConnectyCube.videochat.onUserNotAnswerListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };
        ConnectyCube.videochat.onRejectCallListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };
        ConnectyCube.videochat.onStopCallListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };
        ConnectyCube.videochat.onDisconnectedListener = () => {
          if (isMountedRef.current) setCallState("ended");
        };

        if (isTutor) startCall();
        else setCallState("waiting");
      } catch (authError) {
        if (isMountedRef.current) setCallState("ended");
      }
    };

    initSDK();
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      stopLocalStream(localStreamRef.current);
      stopRemoteStream(remoteStreamRef.current);
      if (sessionRef.current) sessionRef.current.stop({});
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
        const incomingElements = JSON.parse(data.elements);
        excalidrawApiRef.current.updateScene({ elements: incomingElements });
      }
      if (data.files) excalidrawApiRef.current.addFiles(data.files);
    };
    firestoreUnsubscribeRef.current = listenToWhiteboard(
      booking._id,
      currentUser.cb_id,
      opponentUser.cb_id,
      handleRemoteUpdate,
    );
  }, [isExcalidrawReady, booking._id]);

  const startCall = async () => {
    if (!isMountedRef.current) return;
    setCallState("connecting");

    const calleesIds = [opponentId];
    const sessionType = ConnectyCube.videochat.CallType.VIDEO;
    const newSession = ConnectyCube.videochat.createNewSession(
      calleesIds,
      sessionType,
      {},
    );
    sessionRef.current = newSession;

    let localStream = null;
    try {
      // Try to get media, but continue if denied
      localStream = await newSession.getUserMedia({ audio: true, video: true });
      localStreamRef.current = localStream;
      newSession.attachMediaStream("localVideo", localStream, { muted: true });
    } catch (err) {
      console.warn("Tutor starting call without camera/mic permissions");
    }

    newSession.call({ bookingId: booking._id }, (error) => {
      if (error && isMountedRef.current) setCallState("ended");
      else if (isMountedRef.current) setCallState("ringing");
    });
  };

  const toggleMuteAudio = () => {
    if (!sessionRef.current) return;
    setIsMutedAudio((prev) => {
      const state = !prev;
      state
        ? sessionRef.current.mute("audio")
        : sessionRef.current.unmute("audio");
      return state;
    });
  };

  const toggleMuteVideo = () => {
    if (!sessionRef.current) return;
    setIsMutedVideo((prev) => {
      const state = !prev;
      state
        ? sessionRef.current.mute("video")
        : sessionRef.current.unmute("video");
      return state;
    });
  };

  const endCall = () => {
    updateClassJoin(booking._id);
    navigate(-1);
  };

  const swapVideos = () => setIsSwapped(!isSwapped);

  if (callState === "waiting") {
    return (
      <div className="waiting-screen">
        <div className="waiting-content">
          <FaVideo className="waiting-icon" />
          <h2>Waiting for tutor to start the session</h2>
          <button onClick={() => navigate(-1)} className="back-btn">
            Back
          </button>
        </div>
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
          onClick={swapVideos}
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
          onChange={(elements) => {
            if (isUpdatingFromRemoteRef.current) {
              isUpdatingFromRemoteRef.current = false;
              return;
            }
            updateWhiteboardElements(booking._id, elements, currentUser.cb_id);
          }}
        />
      </div>

      <footer className="call-footer">
        <span className={`call-status ${callState}`}>
          {callState.toUpperCase()}
        </span>
      </footer>

      {callState === "active" && (
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
        </div>
      )}
    </div>
  );
};

export default VideoCall;
