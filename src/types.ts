export interface Message {
  id: string;
  clientMsgId?: string;
  senderId: string;
  senderName: string;
  avatar?: string;
  text: string;
  color?: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Peer {
  id: string;
  username: string;
  dataChannel: RTCDataChannel | null;
  stream: MediaStream | null;
}

export interface TalkState {
  hostId: string | null;
  speakers: string[];
  queue: string[];
  sukuchaActive?: boolean;
  sukuchaVideoId?: string | null;
}

export interface FileTransfer {
  id: string;
  name: string;
  fileName?: string; // Legacy field support
  size: number;
  type: string;
  progress: number;
  status: 'requesting' | 'transferring' | 'completed' | 'cancelled' | 'failed';
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  blob?: Blob;
  url?: string;
  timestamp: number;
}
