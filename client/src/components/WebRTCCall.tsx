import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Socket } from "socket.io-client";

interface WebRTCCallProps {
  socket: Socket | null;
  localUserId: number;
  remoteUserId: number;
  callType: "audio" | "video";
  onCallEnd: () => void;
  partnerName?: string;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export default function WebRTCCall({
  socket,
  localUserId,
  remoteUserId,
  callType,
  onCallEnd,
  partnerName = "Partner",
}: WebRTCCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "failed">(
    "connecting"
  );

  // Initialize WebRTC connection
  useEffect(() => {
    if (!socket) return;

    const initializeConnection = async () => {
      try {
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });

        localStreamRef.current = stream;

        // Display local video
        if (localVideoRef.current && callType === "video") {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = peerConnection;

        // Add local stream tracks
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          console.log("[WebRTC] Received remote track:", event.track.kind);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("webrtc:ice-candidate", remoteUserId, event.candidate.toJSON());
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log("[WebRTC] Connection state:", peerConnection.connectionState);
          if (peerConnection.connectionState === "connected") {
            setConnectionState("connected");
            toast.success("Call connected!");
          } else if (peerConnection.connectionState === "failed") {
            setConnectionState("failed");
            toast.error("Connection failed");
          }
        };

        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("webrtc:offer", remoteUserId, offer);

        setConnectionState("connecting");
      } catch (error) {
        console.error("[WebRTC] Error initializing connection:", error);
        toast.error("Failed to initialize call");
        onCallEnd();
      }
    };

    // Listen for remote offer
    socket.on("webrtc:offer-received", async (data) => {
      if (data.senderId === remoteUserId && peerConnectionRef.current) {
        try {
          const offer = new RTCSessionDescription(data.offer);
          await peerConnectionRef.current.setRemoteDescription(offer);

          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit("webrtc:answer", remoteUserId, answer);
        } catch (error) {
          console.error("[WebRTC] Error handling offer:", error);
        }
      }
    });

    // Listen for remote answer
    socket.on("webrtc:answer-received", async (data) => {
      if (data.senderId === remoteUserId && peerConnectionRef.current) {
        try {
          const answer = new RTCSessionDescription(data.answer);
          await peerConnectionRef.current.setRemoteDescription(answer);
        } catch (error) {
          console.error("[WebRTC] Error handling answer:", error);
        }
      }
    });

    // Listen for ICE candidates
    socket.on("webrtc:ice-candidate-received", async (data) => {
      if (data.senderId === remoteUserId && peerConnectionRef.current) {
        try {
          const candidate = new RTCIceCandidate(data.candidate);
          await peerConnectionRef.current.addIceCandidate(candidate);
        } catch (error) {
          console.error("[WebRTC] Error adding ICE candidate:", error);
        }
      }
    });

    initializeConnection();

    return () => {
      socket.off("webrtc:offer-received");
      socket.off("webrtc:answer-received");
      socket.off("webrtc:ice-candidate-received");
    };
  }, [socket, remoteUserId, callType]);

  // Call duration timer
  useEffect(() => {
    if (connectionState !== "connected") return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      toast.info(isAudioEnabled ? "Microphone muted" : "Microphone unmuted");
    }
  };

  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      toast.info(isVideoEnabled ? "Camera turned off" : "Camera turned on");
    }
  };

  const handleEndCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Notify remote user
    socket?.emit("call:end", remoteUserId);

    onCallEnd();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-4"
      >
        {/* Video Container */}
        <div className="relative w-full flex-1 bg-black rounded-[3rem] overflow-hidden border border-foreground/5 shadow-2xl flex items-center justify-center max-h-[70vh]">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Placeholder if no remote video yet */}
          <AnimatePresence>
            {connectionState !== "connected" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center -z-10"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto"
                  >
                    {callType === "video" ? (
                      <Video className="w-8 h-8 text-white/50" />
                    ) : (
                      <Phone className="w-8 h-8 text-white/50" />
                    )}
                  </motion.div>
                  <p className="text-white/40 font-medium tracking-widest uppercase text-xs">
                    {connectionState === "connecting" ? "Connecting..." : "Connection Failed"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Local Video (PiP) */}
          {callType === "video" && (
            <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>
          )}

          {/* Call Duration */}
          {connectionState === "connected" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full"
            >
              <p className="text-white font-mono text-sm">{formatDuration(callDuration)}</p>
            </motion.div>
          )}

          {/* Partner Name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full"
          >
            <p className="text-white font-medium text-sm">{partnerName}</p>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-8">
          <Button
            onClick={handleToggleAudio}
            size="lg"
            className={`h-14 w-14 rounded-full transition-transform hover:scale-110 border border-white/30 ${
              isAudioEnabled
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-red-500/30 text-red-400 hover:bg-red-500/40"
            }`}
            title={isAudioEnabled ? "Mute" : "Unmute"}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          {callType === "video" && (
            <Button
              onClick={handleToggleVideo}
              size="lg"
              className={`h-14 w-14 rounded-full transition-transform hover:scale-110 border border-white/30 ${
                isVideoEnabled
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-red-500/30 text-red-400 hover:bg-red-500/40"
              }`}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
          )}

          <Button
            onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
            size="lg"
            className="h-14 w-14 rounded-full bg-white/20 text-white hover:bg-white/30 shadow-xl transition-transform hover:scale-110 border border-white/30"
            title={isSpeakerEnabled ? "Mute speaker" : "Unmute speaker"}
          >
            {isSpeakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          <Button
            onClick={handleEndCall}
            size="lg"
            className="h-16 w-16 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xl transition-transform hover:scale-110"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
