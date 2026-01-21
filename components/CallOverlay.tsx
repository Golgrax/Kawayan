import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, User, Loader2, Mic, MicOff, Video, VideoOff, Monitor, ScreenShare, ScreenShareOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Props {
  onEndCall: () => void;
  roomId?: string;
  isAgent?: boolean;
  reason?: string;
}

const CallOverlay: React.FC<Props> = ({ onEndCall, roomId, isAgent = false, reason }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(isAgent); // Agent starts with video OFF
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' }
    ]
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('kawayan_session') || '{}');
    const actualRoomId = roomId || `KawayanSupport-${session.id?.substring(session.id.length - 4) || Math.floor(Math.random() * 10000)}`;
    
    const socket = io(window.location.origin);
    socketRef.current = socket;

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: { ideal: 15, max: 24 } }, 
          audio: { echoCancellation: true, noiseSuppression: true } 
        });
        
        setLocalStream(stream);
        
        // Agent starts with video disabled
        if (isAgent) {
          stream.getVideoTracks().forEach(track => { track.enabled = false; });
        }

        socket.emit('join-room', actualRoomId);

        if (!isAgent) {
          fetch('/api/support/calls/register', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('kawayan_jwt')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roomName: actualRoomId, reason })
          }).catch(e => console.error("Call registration failed", e));
        }

        socket.on('user-connected', async (userId) => {
          const pc = createPeerConnection(userId, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal', { to: userId, signal: offer });
        });

        socket.on('signal', async (data) => {
          let pc = pcRef.current;
          
          if (data.signal.type === 'offer') {
            pc = createPeerConnection(data.from, stream);
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', { to: data.from, signal: answer });
          } else if (data.signal.type === 'answer') {
            await pc?.setRemoteDescription(new RTCSessionDescription(data.signal));
          } else if (data.signal.candidate) {
            await pc?.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          }
        });

      } catch (err) {
        console.error("Call error:", err);
        alert("Could not access camera/microphone.");
        onEndCall();
      }
    };

    startCall();

    return () => {
      socket.disconnect();
      localStream?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      pcRef.current?.close();
      
      const agentSession = isAgent ? JSON.parse(localStorage.getItem('kawayan_session') || '{}') : null;
      
      // If user (or agent ending), we unregister the call
      fetch('/api/support/calls/unregister', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('kawayan_jwt')}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ agentId: agentSession?.id })
      }).catch(() => {});
    };
  }, []);

  const createPeerConnection = (targetId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', { to: targetId, signal: { candidate: event.candidate } });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setStatus('connected');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatus('disconnected');
      }
    };

    return pc;
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current || !localStream) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (!pcRef.current || !localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
    
    if (sender) {
      sender.replaceTrack(videoTrack);
    }

    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  };

  // Check if remote video is effectively off (black/no stream)
  const isRemoteVideoActive = remoteStream && remoteStream.getVideoTracks().some(t => t.enabled);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 relative bg-slate-800 flex items-center justify-center overflow-hidden">
           {/* Remote Video */}
           <video 
             ref={remoteVideoRef} 
             autoPlay 
             playsInline 
             className={`w-full h-full object-contain ${!isRemoteVideoActive ? 'hidden' : 'block'}`} 
           />

           {(!isRemoteVideoActive || status !== 'connected') && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white p-8 text-center">
                {status === 'connecting' ? (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
                    <p className="font-bold text-lg">Waiting for agent...</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs">{reason || 'Establishing Peer-to-Peer Bridge'}</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                       <User className="w-12 h-12 text-slate-600" />
                    </div>
                    <p className="font-bold text-slate-300">Agent Connected</p>
                    <p className="text-xs text-slate-500 mt-1">Audio Only</p>
                  </>
                )}
             </div>
           )}

           {/* Floating Local Video - Smaller when cam off */}
           <div className={`absolute top-6 right-6 transition-all duration-500 ${isVideoOff && !isScreenSharing ? 'w-16 h-16' : 'w-48 h-36'} bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20`}>
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff && !isScreenSharing ? 'opacity-0' : 'opacity-100'}`} 
              />
              {isVideoOff && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <User className="w-6 h-6 text-slate-600" />
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center pointer-events-none">
                   <ScreenShare className="w-6 h-6 text-emerald-400" />
                </div>
              )}
           </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-900 p-6 flex justify-center items-center gap-4 border-t border-slate-800">
           <div className="flex gap-2">
              <button 
                onClick={toggleMute}
                className={`p-4 rounded-2xl transition flex items-center gap-2 ${isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                <span className="text-xs font-bold hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button 
                onClick={toggleVideo}
                className={`p-4 rounded-2xl transition flex items-center gap-2 ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title={isVideoOff ? "Start Video" : "Stop Video"}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5"/> : <Video className="w-5 h-5"/>}
                <span className="text-xs font-bold hidden sm:inline">Video</span>
              </button>

              <button 
                onClick={toggleScreenShare}
                className={`p-4 rounded-2xl transition flex items-center gap-2 ${isScreenSharing ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Share Screen"
              >
                {isScreenSharing ? <ScreenShareOff className="w-5 h-5"/> : <Monitor className="w-5 h-5"/>}
                <span className="text-xs font-bold hidden sm:inline">Screen</span>
              </button>
           </div>

           <div className="h-8 w-px bg-slate-800 mx-2" />

           <button 
             onClick={onEndCall}
             className="p-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition shadow-lg flex items-center gap-2 font-bold px-8"
           >
             <PhoneOff className="w-5 h-5" /> <span>End Call</span>
           </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-6 text-[10px] text-slate-500 uppercase font-black tracking-widest">
         <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Native P2P Bridge</span>
         <span>•</span>
         <span>Session Logged</span>
      </div>
    </div>
  );
};

export default CallOverlay;
