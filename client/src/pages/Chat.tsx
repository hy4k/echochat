import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  LogOut, MessageCircle, Phone, Video, Check, CheckCheck,
  Sparkles, Sun, Heart, Send, Mic, Paperclip, X, RotateCcw
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

const ROOM_ID = "sanctuary-room";

export default function Chat() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Call State
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ type: "audio" | "video", offer: any } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const messagesQuery = trpc.chat.getMessages.useQuery(undefined, {
    refetchInterval: 3000,
    enabled: !!user,
  });

  const otherUserQuery = trpc.chat.getOtherUser.useQuery(undefined, {
    enabled: !!user,
  });

  const [showBottleInput, setShowBottleInput] = useState(false);
  const [showSmileys, setShowSmileys] = useState(false);
  const [bottleContent, setBottleContent] = useState("");

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to whisper your message.");
      console.error(err);
    }
  });

  const sendBottleMutation = trpc.bottle.sendBottle.useMutation({
    onSuccess: () => {
      setShowBottleInput(false);
      setBottleContent("");
      toast.success("Message bottled and cast into the sea.");
    }
  });

  const bottlesQuery = trpc.bottle.getBottles.useQuery(undefined, {
    refetchInterval: 5000,
    enabled: !!user
  });

  const openBottleMutation = trpc.bottle.openBottle.useMutation({
    onSuccess: () => {
      utils.bottle.getBottles.invalidate();
    }
  });

  // Socket & Signaling
  useEffect(() => {
    // Connect to same origin (Vite proxy forwards to Express) or fallback
    const socketUrl = window.location.hostname === "localhost" ? "http://localhost:3003" : window.location.origin;
    socketRef.current = io(socketUrl, {
      transports: ["websocket", "polling"], // Try websocket first
      reconnectionAttempts: 5,
    });

    socketRef.current.emit("join-room", ROOM_ID);

    socketRef.current.on("user-connected", (userId) => {
      toast.success("Partner connected to sanctuary.");
    });

    socketRef.current.on("offer", async (payload) => {
      // Ignore offers from myself (if logged in on multiple devices)
      if (payload.offer.senderId === user?.id) return;
      if (isCalling) {
        // Auto-decline if busy logic could go here
        return;
      }
      setIncomingCall({ type: payload.type, offer: payload.offer });
    });

    socketRef.current.on("answer", async (payload) => {
      // Ignore answers from myself
      if (payload.answer.senderId === user?.id) return;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      }
    });

    socketRef.current.on("ice-candidate", async (payload) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(payload.candidate);
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
    toast.success("Disconnected from sanctuary.");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesQuery.data]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) {
      if (!user) toast.error("Identity unknown. Please reconnect.");
      return;
    }

    const content = inputValue;
    setInputValue("");
    setShowSmileys(false); // Close picker if open

    try {
      await sendMessageMutation.mutateAsync({
        receiverId: otherUserQuery.data?.id, // Use actual ID from DB
        content,
      });
    } catch (e) {
      // Handled by onError
    }
    // Handled by onError
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Helper: Compress image to avoid 413 Payload Too Large
    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);

            // Compress to JPEG at 80% quality
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });
    };

    try {
      toast.info("Preparing memory...");
      const base64 = await compressImage(file);

      await sendMessageMutation.mutateAsync({
        receiverId: otherUserQuery.data?.id,
        content: "", // No text content
        mediaUrl: base64,
        messageType: "image"
      });
      toast.success("Memory shared.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to share memory.");
    }
  };

  const KAOMOJI_CATEGORIES = [
    { name: "Love", items: ["(｡♥‿♥｡)", "( ˘ ³˘)♥", "♡ (⇀ 3 ↼)", "(´｡• ᵕ •｡`) ♡"] },
    { name: "Happy", items: ["(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "(✿◠‿◠)", "(* ^ ω ^)", "╰(▔∀▔)╯"] },
    { name: "Shy", items: ["(⁄ ⁄•⁄ω⁄•⁄ ⁄)", "(*/_＼)", "(◡‿◡ *)", "(//▽//)"] },
    { name: "Sad", items: ["(╥_╥)", "(个_个)", "(｡•́︿•̀｡)", "( ◡́.◡̀)(^◡^ )"] },
  ];

  const handleSendBottle = async () => {
    if (!bottleContent.trim()) return;
    try {
      await sendBottleMutation.mutateAsync({ content: bottleContent });
    } catch (e) {
      toast.error("Failed to seal the bottle.");
    }
  };

  const handleOpenBottle = async (bottle: any) => {
    toast(
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center gap-2 text-accent font-serif italic text-lg">
          <Sparkles className="w-4 h-4" />
          <span>A message from the horizon...</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">{bottle.content}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full border-accent/20 hover:bg-accent/5 text-xs uppercase tracking-widest"
          onClick={() => {
            openBottleMutation.mutate({ id: bottle.id });
            toast.dismiss();
          }}
        >
          Keep in Heart
        </Button>
      </div>,
      { duration: Infinity, position: "top-center", style: { background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)" } }
    );
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId: ROOM_ID,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async (type: "audio" | "video") => {
    setIsCalling(true);
    setCallType(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("offer", {
        roomId: ROOM_ID,
        type,
        offer: { ...offer, senderId: user?.id } // Attach sender ID
      });

      toast.success(`Calling partner (${type})...`);

    } catch (err) {
      console.error("Failed to start call", err);
      toast.error("Could not access camera/microphone.");
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    setIsCalling(true);
    setCallType(incomingCall.type);
    setIncomingCall(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.type === "video",
        audio: true
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("answer", {
        roomId: ROOM_ID,
        answer: { ...answer, senderId: user?.id } // Attach sender ID
      });

      toast.success("Call connected.");

    } catch (err) {
      console.error("Failed to accept call", err);
      toast.error("Connection failed.");
      endCall();
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    localStreamRef.current = null;
    peerConnectionRef.current = null;
    setIsCalling(false);
    setCallType(null);
    setIncomingCall(null);
    toast.info("Call ended.");
  };

  const messages = messagesQuery.data || [];

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col selection:bg-accent/30 box-border relative overflow-hidden">
      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && !isCalling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
                {incomingCall.type === "video" ? <Video className="w-8 h-8 text-accent" /> : <Phone className="w-8 h-8 text-accent" />}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">Incoming Call</h3>
                <p className="text-muted-foreground text-sm">Partner is trying to reach you...</p>
              </div>
              <div className="flex gap-4 w-full">
                <Button onClick={() => setIncomingCall(null)} variant="destructive" className="flex-1 h-12 rounded-xl">
                  Decline
                </Button>
                <Button onClick={acceptCall} className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-white">
                  Accept
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message in a Bottle Found Overlay */}
      <AnimatePresence>
        {bottlesQuery.data && bottlesQuery.data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-32 right-8 z-[60]"
          >
            <div
              className="relative group cursor-pointer"
              onClick={() => handleOpenBottle(bottlesQuery.data[0])}
            >
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse" />
              <div className="w-16 h-16 bg-white/80 backdrop-blur-xl rounded-full border border-white/60 shadow-2xl flex items-center justify-center relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 via-accent/10 to-accent/0 animate-[slow-spin_4s_linear_infinite]" />
                <Sparkles className="w-6 h-6 text-accent animate-[float_3s_ease-in-out_infinite]" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                {bottlesQuery.data.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Bottle Modal */}
      <AnimatePresence>
        {showBottleInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBottleInput(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#fdfaf6] rounded-[2rem] shadow-2xl overflow-hidden border border-white/50"
            >
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-accent" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-7-1.9-3-1.7-5-3-7h-2c-1.3 2-1.1 4-3 7-2 3.1-3 5-3 7a7 7 0 0 0 7 7z" /></svg>
                  </div>
                  <h3 className="text-2xl font-serif text-foreground">Message in a Bottle</h3>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">For when they return to shore</p>
                </div>

                <div className="relative">
                  <textarea
                    value={bottleContent}
                    onChange={(e) => setBottleContent(e.target.value)}
                    placeholder="Write a message for them to find..."
                    className="w-full h-32 bg-white/50 rounded-2xl p-4 text-foreground placeholder:text-foreground/30 resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 font-serif italic text-lg leading-relaxed border border-black/5"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setShowBottleInput(false)} className="flex-1 h-12 rounded-xl">
                    Discard
                  </Button>
                  <Button onClick={handleSendBottle} disabled={!bottleContent.trim()} className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-white shadow-lg">
                    Cast into Sea
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-8 w-full max-w-4xl p-8 h-full">
              <div className="relative w-full flex-1 bg-black rounded-[3rem] overflow-hidden border border-foreground/5 shadow-2xl flex items-center justify-center">

                {/* Remote Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Placeholder if no remote video yet */}
                <div className="absolute inset-0 flex items-center justify-center -z-10">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto animate-pulse">
                      {callType === "video" ? <Video className="w-8 h-8 text-white/50" /> : <Phone className="w-8 h-8 text-white/50" />}
                    </div>
                    <p className="text-white/40 font-medium tracking-widest uppercase text-xs">Waiting for Partner...</p>
                  </div>
                </div>

                {/* Local Stream (PiP) */}
                {callType === "video" && (
                  <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                  <Button
                    onClick={endCall}
                    size="lg"
                    className="h-16 w-16 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xl transition-transform hover:scale-110"
                  >
                    <Phone className="w-6 h-6 rotate-[135deg]" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="glass-card border-x-0 border-t-0 sticky top-0 z-50 px-4 py-4 md:px-8 bg-white/40 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 bg-white/60 backdrop-blur-xl rounded-xl flex items-center justify-center border-accent/20 cursor-pointer shadow-sm"
              onClick={() => navigate("/")}
            >
              <Heart className="w-6 h-6 text-accent fill-accent" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-tight mb-1 text-foreground">
                {user?.name ? `${user.name}'s Horizon` : "Whisper Stream"}
              </h1>
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(255,107,107,0.5)]"
                />
                <p className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-black">
                  Souls Linked
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <HeaderButton icon={<Phone className="w-5 h-5" />} onClick={() => startCall("audio")} title="Voice Call" />
            <HeaderButton icon={<Video className="w-5 h-5" />} onClick={() => startCall("video")} title="Video Call" />
            <div className="h-6 w-[1px] bg-accent/10 mx-1" />
            <HeaderButton icon={<LogOut className="w-4 h-4" />} onClick={handleLogout} variant="destructive" title="Depart Sanctuary" />
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.4, scale: 1 }}
                className="w-32 h-32 rounded-full glass-card flex items-center justify-center mb-10"
              >
                <MessageCircle className="w-14 h-14 text-accent" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                className="text-4xl font-serif italic mb-4"
              >
                The silence is peaceful.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="max-w-xs font-medium uppercase tracking-widest text-xs leading-loose"
              >
                Say something that only they should hear...
              </motion.p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message: any) => {
                const isMe = message.senderId === user?.id;
                return (
                  <motion.div
                    layout
                    key={message.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`group flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                      <div className={`p-6 rounded-[2.5rem] shadow-sm font-medium leading-relaxed overflow-hidden ${isMe
                        ? "bg-accent text-accent-foreground rounded-tr-none shadow-lg shadow-accent/10"
                        : "bg-white/70 backdrop-blur-md text-foreground rounded-tl-none border border-white/60 shadow-lg shadow-black/5"
                        }`}>
                        {message.messageType === "image" ? (
                          <img src={message.mediaUrl} alt="Shared memory" className="max-w-full rounded-xl" />
                        ) : (
                          <p className="text-base">{message.content}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-3 mt-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] ${isMe ? "text-accent/40" : "text-muted-foreground/30"}`}>
                        <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {isMe && <StatusIndicator status="read" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className="px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2 mt-auto">
        <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white/50 shadow-2xl">
          <div className="flex gap-2 items-center">
            {/* Bottle Button */}
            <Button variant="ghost" size="icon" onClick={() => setShowBottleInput(true)} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-foreground/60 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-7-1.9-3-1.7-5-3-7h-2c-1.3 2-1.1 4-3 7-2 3.1-3 5-3 7a7 7 0 0 0 7 7z" /></svg>
            </Button>

            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-foreground/60 shrink-0">
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Whisper something..."
                className="bg-transparent border-none shadow-none text-foreground placeholder:text-foreground/30 h-14 px-6 text-lg font-medium focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-2">

              {/* Expression Picker Trigger */}
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setShowSmileys(!showSmileys)} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-foreground/60 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </Button>
                <AnimatePresence>
                  {showSmileys && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-16 right-0 w-64 bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-3xl shadow-xl z-50"
                    >
                      <div className="space-y-4">
                        {KAOMOJI_CATEGORIES.map((cat) => (
                          <div key={cat.name}>
                            <h4 className="text-[10px] uppercase font-bold text-foreground/40 mb-2 tracking-widest">{cat.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              {cat.items.map((item) => (
                                <button
                                  key={item}
                                  onClick={() => { setInputValue(prev => prev + item + " "); setShowSmileys(false); }}
                                  className="text-xs py-1 px-2 bg-accent/5 hover:bg-accent/20 rounded-lg text-foreground/80 hover:text-accent transition-colors"
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="w-12 h-12 rounded-full p-0 flex items-center justify-center shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 transition-transform shadow-lg border-none"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  if (status === "sent") return <Check className="w-3 h-3" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 opacity-60" />;
  if (status === "read") return <CheckCheck className="w-3 h-3 text-accent" />;
  return null;
}

function HeaderButton({ icon, onClick, title, variant = "ghost" }: { icon: React.ReactNode, onClick?: () => void, title: string, variant?: "ghost" | "destructive" }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`glass-card w-10 h-10 rounded-xl border-white/5 transition-all text-muted-foreground hover:text-accent group ${variant === "destructive" ? "hover:text-destructive hover:border-destructive/20" : "hover:border-accent/20"}`}
      title={title}
    >
      <div className="group-hover:scale-110 transition-transform">{icon}</div>
    </Button>
  );
}
