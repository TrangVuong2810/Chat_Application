export interface IUser {
    id: string; 
    fullName: string;
    username: string;
    email: string;
    phone: string;
    address: string;
    roles: Role[];
    userState: UserState; 
    conversationsByUserId: IConversation[];
    lastOnline: Date | any; 
    profilePicture: string;
    sessions: number;
}
export interface IFriendInvitationResponse {
    requestId: string;
    sender: IUser;
}
export interface IConversationResponse {
    id: string;
    participants: IUser[] | undefined;
    messages: IMessage[];
    dateUpdate: string;
    groupConversation: boolean;
    groupName?: string;
}
export interface IConversation {
    id: string;
    participants: IUser[];
    messages: IMessage[];
    groupConversation: boolean;
    dateStarted: Date; 
    status: ConversationStatus;
}
export interface IConversationReq {
  participants: string[]; 
}
enum ConversationStatus {
    ACCEPTED = 'ACCEPTED',
    PENDING = 'PENDING',
    REJECTED = 'REJECTED',
}
export enum UserState {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    BUSY = 'BUSY',
    AWAY = 'AWAY'
}
enum Role {
    ROLE_BASIC = 'ROLE_USER',
    ROLE_ADMIN = 'ROLE_ADMIN',
}
enum MessageState {
    RECEIVED = 'RECEIVED',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    DELETED = 'DELETED',
    EDITED = 'EDITED',
}

export interface IMessage {
    id: string;
    sender: IUser;
    conversation: IConversation;
    content: string;
    image: ArrayBuffer | null; 
    createdAt: Date; 
    dateSent: Date | null;
    dateDelivered: Date | null;
    dateRead: Date | null;
    states: MessageState[];
}
export interface IMessageResponse {
    id: string;
    sender: IUser;
    conversationId: string;
    dateSent: Date | any;
    dateDelivered: Date | any;
    dateRead: Date | any;
    states: MessageState[];
    content: string;
    image?: string;
}
export interface IMessageReq {
    username: string;
    conversationId: string;
    content: string;
    image?: string | any;
}
export interface IConversationDto {
    id: string; 
    fullName: string;
    username: string;
    image: string;
    lastOnline: Date;
    typingState: TypingState;
}
type TypingState = | "IDLE" | "TYPING";

export interface INotificationDTO {
    content: string;
    type: NotificationType;
    metadata: string;
}
export interface ITheme {
  primary: string
  secondary: string
  background: string
  backgroundSecondary?: string
  text?: string
  textSecondary?: string
  backgroundStyle?: React.CSSProperties
  iconStyle?: React.CSSProperties
}
type NotificationType =
    | "USER_STATE"
    | "ONLINE_USERS"
    | "INCOMING_MESSAGE"
    | "INCOMING_CALL"
    | "REJECTED_CALL"
    | "CANCELLED_CALL"
    | "ACCEPTED_CALL";

export interface ISenderReq {
    senderId: string;
    friendRequestStatus: string;
    friendRole?: string;
}
type FriendRequestStatus =
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"