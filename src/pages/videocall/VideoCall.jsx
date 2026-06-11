import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConnectyCube from 'connectycube';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './VideoCall.css';

import { startClassJoin, updateClassJoin } from '../../data/modules/booking-module';
import { addWhiteboardFile, listenToWhiteboard, updateWhiteboardElements } from './whiteboard-services';
import { CONTACT_DETAILS } from '../../data/config';
import { rescheduleBooking } from '../../data/modules/student-module';
import { requestRefund } from '../../data/modules/student-module';

import {
  FaChalkboard,
  FaCompress,
  FaExpand,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
} from 'react-icons/fa';

function parseHHMM(timeStr) {
  if (typeof timeStr !== 'string') return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
}

function bookingDurationMs(booking) {
  const a = parseHHMM(booking?.startTime);
  const b = parseHHMM(booking?.endTime);
  if (!a || !b) return null;
  const start = a.h * 60 + a.min;
  const end = b.h * 60 + b.min;
  const minutes = end - start;
  if (minutes <= 0) return null;
  return minutes * 60 * 1000;
}

function addMinutesToHHMM(hhmm, minutesToAdd) {
  const t = parseHHMM(hhmm);
  if (!t || typeof minutesToAdd !== 'number' || Number.isNaN(minutesToAdd)) return '';
  const total = (t.h * 60 + t.min + minutesToAdd) % (24 * 60);
  const safe = total < 0 ? total + 24 * 60 : total;
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function tzDateStr(date, timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      date,
    );
  } catch {
    return new Date(date).toISOString().split('T')[0];
  }
}

function tzNowParts(timeZone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function tzOffsetMs(timeZone) {
  // Same idea as previous code: derive offset between local time and tz time.
  const now = new Date();
  try {
    const p = tzNowParts(timeZone);
    const z = new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    return now.getTime() - z.getTime();
  } catch {
    return 0;
  }
}

function tzDateTime(dateStr, hhmm, timeZone) {
  const t = parseHHMM(hhmm);
  if (!dateStr || !t || !timeZone) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const naiveUtc = new Date(Date.UTC(y, m - 1, d, t.h, t.min, 0));
  return new Date(naiveUtc.getTime() + tzOffsetMs(timeZone));
}

function getCbId(user) {
  if (!user || typeof user !== 'object') return undefined;
  return (
    user.cb_id ??
    user.cbId ??
    user.cbID ??
    user.connectyCubeId ??
    user.connectycubeId ??
    user.connecty_cube_id ??
    user.connecty_cubeId ??
    user.connectycube_id
  );
}
function getEmail(user) {
  if (!user || typeof user !== 'object') return undefined;
  return user.email ?? user.userEmail ?? user.mail;
}

function useStableRef(value) {
  const r = useRef(value);
  useEffect(() => {
    r.current = value;
  }, [value]);
  return r;
}

export default function VideoCall() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const booking = state?.booking;
  const isTutor = state?.isTutor ?? true;

  const [status, setStatus] = useState('init'); // init | lobby | waiting | calling | active | ended
  const [error, setError] = useState('');
  const [showWhiteboard, setShowWhiteboard] = useState(() => !!isTutor);
  const [showNoShowPopup, setShowNoShowPopup] = useState(false);
  const [joinedAtMs, setJoinedAtMs] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [isMutedVideo, setIsMutedVideo] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const isMountedRef = useRef(true);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const endTimerRef = useRef(null);
  const excalidrawApiRef = useRef(null);
  const whiteboardUnsubRef = useRef(null);
  const isUpdatingFromRemoteRef = useRef(false);
  const sentFilesRef = useRef(new Set());
  const debounceRef = useRef(null);

  const statusRef = useStableRef(status);
  const bookingRef = useStableRef(booking);

  const tutorTimezone = useMemo(() => {
    const t = booking?.tutorId || booking?.tutor || booking?.tutorDetails;
    return t?.timezone || 'Asia/Kolkata';
  }, [booking]);

  const bookingDurationMinutes = useMemo(() => {
    const ms = bookingDurationMs(booking);
    if (!ms) return null;
    return Math.round(ms / 60000);
  }, [booking]);

  const formatTimeInTz = useCallback(
    (ms) => {
      if (!ms) return '';
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: tutorTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(ms));
      } catch {
        return new Date(ms).toLocaleTimeString();
      }
    },
    [tutorTimezone],
  );

  const classTimes = useMemo(() => {
    if (!booking) return { start: null, end: null, durationMs: null };
    // Use booking's actual date (not "today"), in tutor timezone.
    const bookingDateStr = tzDateStr(new Date(booking.startDate), tutorTimezone);
    const start = tzDateTime(bookingDateStr, booking.startTime, tutorTimezone);
    const end = tzDateTime(bookingDateStr, booking.endTime, tutorTimezone);
    return { start, end, durationMs: bookingDurationMs(booking) };
  }, [booking, tutorTimezone]);

  const { currentUser, opponentUser, currentCbId, currentEmail, opponentCbId } = useMemo(() => {
    const bookingTutor = booking?.tutorId || booking?.tutor || booking?.tutorDetails || {};
    const bookingStudent = booking?.studentId || booking?.student || booking?.studentDetails || {};

    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem('user') || '{}') || {};
    } catch {
      stored = {};
    }

    const me = isTutor ? (getCbId(bookingTutor) ? bookingTutor : stored) : getCbId(bookingStudent) ? bookingStudent : stored;
    const opp = isTutor ? bookingStudent : bookingTutor;

    return {
      currentUser: me,
      opponentUser: opp,
      currentCbId: getCbId(me),
      currentEmail: getEmail(me),
      opponentCbId: getCbId(opp),
    };
  }, [booking, isTutor]);

  const ids = useMemo(() => {
    const userId = currentCbId ? parseInt(String(currentCbId), 10) : NaN;
    const opponentId = opponentCbId ? parseInt(String(opponentCbId), 10) : NaN;
    return { userId, opponentId };
  }, [currentCbId, opponentCbId]);

  const canStartCallNow = useMemo(() => {
    if (!isTutor) return false;
    if (!classTimes.start) return false;
    return Date.now() >= classTimes.start.getTime();
  }, [classTimes.start, isTutor]);

  const cleanupCall = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.stop({});
      } catch {
        // ignore
      }
      sessionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
  }, []);

  // Reset joinedAt when leaving active call
  useEffect(() => {
    if (status === 'active') return;
    setJoinedAtMs(null);
  }, [status]);

  const setupWhiteboard = useCallback(() => {
    if (!bookingRef.current?._id) return;
    if (!excalidrawApiRef.current) return;
    if (!currentCbId || !opponentCbId) return;
    if (whiteboardUnsubRef.current) return;

    const onRemote = (data) => {
      if (!isMountedRef.current || !data) return;
      if (String(data.lastUpdatedBy) === String(currentCbId)) return;

      isUpdatingFromRemoteRef.current = true;
      try {
        if (data.elements && typeof data.elements === 'string') {
          const incoming = JSON.parse(data.elements);
          const existing = excalidrawApiRef.current.getSceneElements();
          const map = new Map(existing.map((el) => [el.id, el]));
          for (const el of incoming) {
            const prev = map.get(el.id);
            if (!prev || el.version > prev.version) map.set(el.id, el);
          }
          excalidrawApiRef.current.updateScene({ elements: Array.from(map.values()) });
        }
        if (data.files && data.files.length > 0) {
          excalidrawApiRef.current.addFiles(data.files);
        }
      } catch (e) {
        console.error('Whiteboard remote update failed', e);
      } finally {
        // next local change will be treated as local
      }
    };

    whiteboardUnsubRef.current = listenToWhiteboard(bookingRef.current._id, currentCbId, opponentCbId, onRemote);
  }, [bookingRef, currentCbId, opponentCbId]);

  const requestMedia = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      s.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }, []);

  const startOutgoingCall = useCallback(async () => {
    if (!isTutor) return;
    if (statusRef.current === 'active') return;
    if (!ConnectyCube.chat?.isConnected) return;

    const ok = await requestMedia();
    if (!ok) {
      setError('Please allow camera & microphone permissions.');
      setStatus('ended');
      return;
    }

    // stop any previous attempt (but never interrupt active)
    if (statusRef.current !== 'active' && sessionRef.current) {
      try {
        sessionRef.current.stop({});
      } catch {
        // ignore
      }
      sessionRef.current = null;
    }

    setStatus('calling');
    const newSession = ConnectyCube.videochat.createNewSession([ids.opponentId], ConnectyCube.videochat.CallType.VIDEO, {});
    sessionRef.current = newSession;

    try {
      const stream = await newSession.getUserMedia({
                audio: true,
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
      });
              if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
                return;
              }
      localStreamRef.current = stream;
      try {
        newSession.attachMediaStream('localVideo', stream, { muted: true });
      } catch (e) {
        console.error('Attach local stream failed', e);
      }

      newSession.call({ bookingId: bookingRef.current?._id }, (err) => {
        if (err && isMountedRef.current) {
          setError('Failed to start the call. Please try again.');
          setStatus('ended');
        }
      });
    } catch (e) {
      console.error('Start call failed', e);
      setError('Failed to start the call. Please check permissions.');
      setStatus('ended');
    }
  }, [ids.opponentId, isTutor, requestMedia, statusRef, bookingRef]);

  const endCall = useCallback(() => {
    cleanupCall();
    setStatus('ended');
    navigate(-1);
  }, [cleanupCall, navigate]);

  const openWhatsAppSupport = useCallback((message) => {
    const phone = CONTACT_DETAILS?.whatsapp ? `91${CONTACT_DETAILS.whatsapp}` : null;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const openEmailSupport = useCallback((subject, body) => {
    const email = CONTACT_DETAILS?.contact_email || CONTACT_DETAILS?.official_email || 'hello.xplooreze@gmail.com';
    const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }, []);

  const handleNoShowExit = useCallback(() => {
    setShowNoShowPopup(false);
    endCall();
  }, [endCall]);

  const handleNoShowReschedule = useCallback(() => {
    setShowNoShowPopup(false);
    // Pre-fill with current booking slot as a starting point
    const d = booking?.startDate ? new Date(booking.startDate) : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setRescheduleDate(`${yyyy}-${mm}-${dd}`);
    const start = booking?.startTime || '';
    setRescheduleStartTime(start);
    const mins = bookingDurationMinutes ?? null;
    setRescheduleEndTime(mins !== null ? addMinutesToHHMM(start, mins) : booking?.endTime || '');
    setRescheduleReason('Tutor didn’t join (no-show).');
    setShowRescheduleModal(true);
  }, [booking?.endTime, booking?.startDate, booking?.startTime, bookingDurationMinutes]);

  // Auto-calculate end time when start time changes (keep same duration)
  useEffect(() => {
    if (!showRescheduleModal) return;
    if (!bookingDurationMinutes) return;
    if (!rescheduleStartTime) return;
    const nextEnd = addMinutesToHHMM(rescheduleStartTime, bookingDurationMinutes);
    if (nextEnd) setRescheduleEndTime(nextEnd);
  }, [bookingDurationMinutes, rescheduleStartTime, showRescheduleModal]);

  const handleNoShowRefund = useCallback(() => {
    setShowNoShowPopup(false);
    setRefundReason('Tutor didn’t join (no-show). Please process refund.');
    setShowRefundModal(true);
  }, []);

  const handleSubmitRefund = useCallback(async () => {
    if (!booking?._id) return;
    if (!refundReason || refundReason.trim().length < 10) {
      alert('Please enter a proper reason (min 10 characters).');
      return;
    }
    try {
      setRefundLoading(true);
      await requestRefund({ bookingId: booking._id, reason: refundReason.trim() });
      setShowRefundModal(false);
      alert(
        'At Xplooreze, we value long-term trust over short-term transactions, and we appreciate your patience while we investigate this properly.\n\nYou will receive an update within [24–48 hours].',
      );
      navigate(-1);
    } catch (e) {
      alert(e?.message || String(e) || 'Failed to submit refund request.');
    } finally {
      setRefundLoading(false);
    }
  }, [booking?._id, navigate, refundReason]);

  const handleSubmitReschedule = useCallback(async () => {
    if (!booking?._id) return;
    if (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) {
      alert('Please select date, start time and end time.');
      return;
    }
    try {
      setRescheduleLoading(true);
      await rescheduleBooking({
        bookingId: booking._id,
        startDate: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
        reason: rescheduleReason,
      });
      setShowRescheduleModal(false);
      alert('Rescheduled successfully.');
      navigate(-1);
    } catch (e) {
      alert(e?.message || String(e) || 'Failed to reschedule.');
    } finally {
      setRescheduleLoading(false);
    }
  }, [
    booking?._id,
    navigate,
    rescheduleDate,
    rescheduleEndTime,
    rescheduleReason,
    rescheduleStartTime,
  ]);

  // init + connect ConnectyCube
  useEffect(() => {
    isMountedRef.current = true;
    if (!booking) {
      setError('No booking data provided.');
      setStatus('ended');
      return () => {};
    }
    if (!currentCbId || !currentEmail || !opponentCbId) {
      setError('Missing user credentials for video call.');
      setStatus('ended');
      return () => {};
    }
    if (!ids.userId || !ids.opponentId || Number.isNaN(ids.userId) || Number.isNaN(ids.opponentId)) {
      setError('Invalid call user ids.');
      setStatus('ended');
      return () => {};
    }

    const original = {
      onRemoteStreamListener: ConnectyCube.videochat?.onRemoteStreamListener || null,
      onCallListener: ConnectyCube.videochat?.onCallListener || null,
      onUserNotAnswerListener: ConnectyCube.videochat?.onUserNotAnswerListener || null,
      onRejectCallListener: ConnectyCube.videochat?.onRejectCallListener || null,
      onStopCallListener: ConnectyCube.videochat?.onStopCallListener || null,
      onDisconnectedListener: ConnectyCube.chat?.onDisconnectedListener || null,
    };

    const init = async () => {
      try {
        const appId = parseInt(import.meta.env.VITE_CONNECTYCUBE_APP_ID || '0', 10);
        const authKey = import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY || '';
        if (!appId || !authKey) throw new Error('Missing ConnectyCube credentials');
        ConnectyCube.init({ appId, authKey });

        await ConnectyCube.createSession({ login: String(currentEmail), password: String(currentEmail) });
        await ConnectyCube.chat.connect({ userId: ids.userId, password: String(currentEmail) });

        ConnectyCube.videochat.onRemoteStreamListener = (callSession, userID, remoteStream) => {
          remoteStreamRef.current = remoteStream;
          try {
            callSession.attachMediaStream('remoteVideo', remoteStream);
        } catch (e) {
            console.error('Attach remote stream failed', e);
          }
          if (!isMountedRef.current) return;

          setStatus('active');
          setShowNoShowPopup(false);
          setJoinedAtMs((prev) => prev ?? Date.now());

          // class tracking & "end time" based on actual connect time
          startClassJoin(bookingRef.current._id);
          if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = setInterval(() => updateClassJoin(bookingRef.current._id), 60000);

          const durationMs = bookingDurationMs(bookingRef.current);
          if (durationMs) {
            if (endTimerRef.current) clearTimeout(endTimerRef.current);
            endTimerRef.current = setTimeout(() => {
              if (!isMountedRef.current) return;
              if (isTutor) alert('Class time ended. Please end the class.');
            }, durationMs);
          }
        };

        ConnectyCube.videochat.onCallListener = async (callSession) => {
          if (!isMountedRef.current) return;
          sessionRef.current = callSession;
          if (isTutor) return; // tutor never accepts incoming in this flow

          setStatus('init');
          try {
            const stream = await callSession.getUserMedia({
        audio: true,
              video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
            });
      if (!isMountedRef.current) {
              stream.getTracks().forEach((t) => t.stop());
        return;
      }
            localStreamRef.current = stream;
            try {
              callSession.attachMediaStream('localVideo', stream, { muted: true });
            } catch (e) {
              console.error('Attach local stream failed', e);
            }
            callSession.accept({});
            setStatus('calling');
          } catch (e) {
            console.error('Accept call failed', e);
            setError('Failed to join call. Please allow camera & microphone.');
            setStatus('ended');
            try {
              callSession.reject({});
            } catch {
              // ignore
            }
          }
        };

        // Don't end the tutor room because student didn't answer. Keep lobby.
        ConnectyCube.videochat.onUserNotAnswerListener = () => {
          if (!isMountedRef.current) return;
          if (isTutor) setStatus('lobby');
        };
        ConnectyCube.videochat.onRejectCallListener = () => { 
          if (!isMountedRef.current) return;
          if (isTutor) setStatus('lobby');
        };
        ConnectyCube.videochat.onStopCallListener = () => {
          if (!isMountedRef.current) return;
          setStatus('ended');
        };
        ConnectyCube.videochat.onDisconnectedListener = () => {
          if (!isMountedRef.current) return;
          setError('Connection lost. Please restart.');
          setStatus('ended');
        };

        setStatus(isTutor ? 'lobby' : 'waiting');
      } catch (e) {
        console.error('ConnectyCube init failed', e);
        setError('Failed to connect. Please refresh and try again.');
        setStatus('ended');
      }
    };

    init();

    return () => {
      isMountedRef.current = false;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = null;

      if (whiteboardUnsubRef.current) {
        try {
          whiteboardUnsubRef.current();
        } catch {
          // ignore
        }
        whiteboardUnsubRef.current = null;
      }

      cleanupCall();

      // restore listeners
      if (original.onRemoteStreamListener) ConnectyCube.videochat.onRemoteStreamListener = original.onRemoteStreamListener;
      if (original.onCallListener) ConnectyCube.videochat.onCallListener = original.onCallListener;
      if (original.onUserNotAnswerListener) ConnectyCube.videochat.onUserNotAnswerListener = original.onUserNotAnswerListener;
      if (original.onRejectCallListener) ConnectyCube.videochat.onRejectCallListener = original.onRejectCallListener;
      if (original.onStopCallListener) ConnectyCube.videochat.onStopCallListener = original.onStopCallListener;
      if (original.onDisconnectedListener) ConnectyCube.chat.onDisconnectedListener = original.onDisconnectedListener;

      try {
        if (ConnectyCube.chat?.isConnected) ConnectyCube.chat.disconnect();
      } catch {
        // ignore
      }
    };
  }, [booking, cleanupCall, currentCbId, currentEmail, ids.opponentId, ids.userId, isTutor, opponentCbId, bookingRef]);

  // whiteboard listener (mount once API ready)
  useEffect(() => {
    setupWhiteboard();
  }, [setupWhiteboard, showWhiteboard]);

  // Tutor auto-start: if tutor is in lobby, start call exactly at scheduled time.
  // If tutor opens after scheduled time, start immediately.
  useEffect(() => {
    if (!booking || !isTutor) return;
    if (!classTimes.start) return;
    if (status !== 'lobby') return;

    const fire = () => {
      if (!isMountedRef.current) return;
      if (statusRef.current !== 'lobby') return;
      startOutgoingCall();
    };

    const delay = classTimes.start.getTime() - Date.now();
    if (delay <= 0) {
      fire();
      return;
    }

    const t = setTimeout(fire, delay);
    return () => clearTimeout(t);
  }, [booking, classTimes.start, isTutor, startOutgoingCall, status, statusRef]);

  // student no-show popup: scheduled start +10min, if still waiting
  useEffect(() => {
    if (!booking || isTutor) return;
    if (status !== 'waiting') {
      setShowNoShowPopup(false);
      return;
    }
    if (!classTimes.start) return;

    const showAt = classTimes.start.getTime() + 10 * 60 * 1000;
    const delay = showAt - Date.now();
    if (delay <= 0) {
      setShowNoShowPopup(true);
        return;
      }
    const t = setTimeout(() => setShowNoShowPopup(true), delay);
    return () => clearTimeout(t);
  }, [booking, classTimes.start, isTutor, status]);

  const onWhiteboardChange = useCallback(
    (elements) => {
      if (!isTutor) return; // student view-only
      if (!showWhiteboard) return;
      if (!isMountedRef.current) return;
      if (!bookingRef.current?._id) return;

    if (isUpdatingFromRemoteRef.current) {
      isUpdatingFromRemoteRef.current = false;
      return;
    }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateWhiteboardElements(bookingRef.current._id, elements, String(currentCbId));
      }, 120);

      // send image files once available
      for (const el of elements) {
        if (el.type !== 'image' || !el.fileId) continue;
        if (sentFilesRef.current.has(el.fileId)) continue;
        sentFilesRef.current.add(el.fileId);

        const poll = async () => {
          for (let i = 0; i < 25; i++) {
            if (!isMountedRef.current) return null;
            const files = excalidrawApiRef.current?.getFiles?.();
            const data = files?.[el.fileId];
            if (data?.dataURL) return data;
            await new Promise((r) => setTimeout(r, 120));
          }
          return null;
        };

        poll()
          .then((fileData) => {
            if (!fileData || !isMountedRef.current) return;
            addWhiteboardFile(bookingRef.current._id, fileData, String(currentCbId));
          })
          .catch(() => {
            sentFilesRef.current.delete(el.fileId);
          });
      }
    },
    [bookingRef, currentCbId, isTutor, showWhiteboard],
  );

  const toggleMuteAudio = useCallback(() => {
    if (!sessionRef.current) return;
    setIsMutedAudio((prev) => {
      const next = !prev;
      try {
        if (next) sessionRef.current.mute('audio');
        else sessionRef.current.unmute('audio');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleMuteVideo = useCallback(() => {
    if (!sessionRef.current) return;
    setIsMutedVideo((prev) => {
      const next = !prev;
      try {
        if (next) sessionRef.current.mute('video');
        else sessionRef.current.unmute('video');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const toggleFullScreen = useCallback(() => {
    const el = document.querySelector('.video-container');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    // Keep local UI state accurate
    if (status === 'ended') cleanupCall();
  }, [cleanupCall, status]);

  if (!booking) {
    return <div className="error-screen">No booking data provided.</div>;
  }
  if (error) {
    return (
      <div className="error-screen">
        <h2>{error}</h2>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  const showTutorStartBtn = isTutor && status === 'lobby' && canStartCallNow;
  const showTutorLobbyHint = isTutor && status === 'lobby' && !canStartCallNow;

  return (
    <div className="video-call-page">
      <div className="video-container">
        {(status === 'calling' || status === 'lobby') && isTutor && (
          <div className="ringing-screen">
            <FaVideo className="ringing-icon" />
            <h3>{status === 'calling' ? 'Calling…' : 'Room is ready'}</h3>
            {showTutorLobbyHint && <p style={{ opacity: 0.85, marginTop: 8 }}>You can prepare notes on the whiteboard.</p>}
            {showTutorStartBtn && (
              <button onClick={startOutgoingCall} className="back-btn" style={{ marginTop: 12 }}>
                Start Call
              </button>
            )}
          </div>
        )}

        {status === 'waiting' && !isTutor && (
          <div className="waiting-screen">
            <div className="waiting-content">
              <FaVideo className="waiting-icon" />
              <h2>Waiting for tutor to start the session</h2>
              <p>
                {booking.subject} - {new Date(booking.startDate).toLocaleDateString()} {booking.startTime}
              </p>
              <button onClick={() => navigate(-1)} className="back-btn">
                Back
              </button>
              {/* <button onClick={() => setShowWhiteboard(true)} className="back-btn" style={{ marginTop: 10 }}>
                View Whiteboard
              </button> */}
            </div>
          </div>
        )}

        <video
          id="remoteVideo"
          autoPlay
          playsInline
          className={`remote-video ${isSwapped ? 'small-video' : 'big-video'}`}
          onClick={status === 'active' ? () => setIsSwapped((s) => !s) : undefined}
        />
        <video
          id="localVideo"
          autoPlay
          muted
          playsInline
          className={`local-video ${isSwapped ? 'big-video' : 'small-video'}`}
          onClick={status === 'active' ? () => setIsSwapped((s) => !s) : undefined}
        />
      </div>

      <div className={`whiteboard-container ${showWhiteboard ? 'visible' : ''}`}>
        <button className="close-whiteboard-btn" onClick={() => setShowWhiteboard(false)}>
          &times;
        </button>
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawApiRef.current = api;
            setupWhiteboard();
          }}
          onChange={(elements) => onWhiteboardChange(elements)}
          initialData={{ elements: [] }}
          theme="light"
          viewModeEnabled={!isTutor}
        />
      </div>

      <footer className="call-footer">
        <h2>{booking.subject}</h2>
        <p>
          {new Date(booking.startDate).toLocaleDateString()} | {booking.startTime} - {booking.endTime}
        </p>
        {joinedAtMs && (
          <p style={{ marginTop: 6, opacity: 0.9 }}>
            Joined at: {formatTimeInTz(joinedAtMs)}
          </p>
        )}
        <span className={`call-status ${status}`}>{status.toUpperCase()}</span>
      </footer>

      {status === 'active' && (
        <div className="controls">
          <button onClick={toggleMuteAudio} className="control-btn audio-btn">
            {isMutedAudio ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button onClick={toggleMuteVideo} className="control-btn video-btn">
            {isMutedVideo ? <FaVideoSlash /> : <FaVideo />}
          </button>
          <button onClick={() => setShowWhiteboard((s) => !s)} className={`control-btn whiteboard-btn ${showWhiteboard ? 'active' : ''}`}>
            <FaChalkboard />
          </button>
          <button onClick={endCall} className="control-btn end-btn">
            <FaPhoneSlash />
          </button>
          <button onClick={toggleFullScreen} className="control-btn fullscreen-btn">
            {isFullScreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      )}

      {status !== 'active' && (
        <div className="controls">
          <button onClick={() => setShowWhiteboard((s) => !s)} className={`control-btn whiteboard-btn ${showWhiteboard ? 'active' : ''}`}>
            <FaChalkboard />
          </button>
          <button onClick={endCall} className="control-btn end-btn">
            <FaPhoneSlash />
          </button>
        </div>
      )}

      {showNoShowPopup && !isTutor && status === 'waiting' && (
        <div className="breakdown-overlay" onClick={() => setShowNoShowPopup(false)}>
          <div className="breakdown-content" onClick={(e) => e.stopPropagation()}>
            <h4>Tutor hasn’t joined</h4>
            <p style={{ opacity: 0.85, marginTop: 6 }}>What would you like to do?</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={handleNoShowExit}>Exit</button>
              <button onClick={handleNoShowReschedule}>Reschedule</button>
              <button onClick={handleNoShowRefund}>Refund</button>
    </div>
          </div>
        </div>
      )}

      {showRescheduleModal && !isTutor && (
        <div className="breakdown-overlay" onClick={() => (rescheduleLoading ? null : setShowRescheduleModal(false))}>
          <div className="breakdown-content" onClick={(e) => e.stopPropagation()}>
            <h4>Reschedule class</h4>
            <p style={{ opacity: 0.85, marginTop: 6 }}>Pick a new date and time for this session.</p>

            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Date</span>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  disabled={rescheduleLoading}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>Start time</span>
                <input
                  type="time"
                  value={rescheduleStartTime}
                  onChange={(e) => setRescheduleStartTime(e.target.value)}
                  disabled={rescheduleLoading}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>End time</span>
                <input
                  type="time"
                  value={rescheduleEndTime}
                  readOnly
                  disabled={rescheduleLoading}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>Reason (optional)</span>
                <textarea
                  rows={3}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  disabled={rescheduleLoading}
                  style={{ resize: 'vertical' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={() => setShowRescheduleModal(false)} disabled={rescheduleLoading}>
                Cancel
              </button>
              <button onClick={handleSubmitReschedule} disabled={rescheduleLoading}>
                {rescheduleLoading ? 'Saving…' : 'Confirm reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && !isTutor && (
        <div className="breakdown-overlay" onClick={() => (refundLoading ? null : setShowRefundModal(false))}>
          <div className="breakdown-content" onClick={(e) => e.stopPropagation()}>
            <h4>Request refund</h4>
            <p style={{ opacity: 0.85, marginTop: 6 }}>
              Please provide a reason. Admin will review and approve before the refund is processed.
            </p>

            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Reason</span>
                <textarea
                  rows={4}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  disabled={refundLoading}
                  style={{ resize: 'vertical' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={() => setShowRefundModal(false)} disabled={refundLoading}>
                Cancel
              </button>
              <button onClick={handleSubmitRefund} disabled={refundLoading}>
                {refundLoading ? 'Submitting…' : 'Submit refund request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}