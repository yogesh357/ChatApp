

export type EventType = "INITIAL_STATE" | "USER_JOINED" | "USER_LEFT" | "CHAT_MESSAGE";


export interface ChatPayload {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

export interface EventMessage<T = unknown> {
    event: EventType;
    payload: T;
}