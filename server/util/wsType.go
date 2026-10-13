package utils

type EventType string

const (
	EventInitialState EventType = "INITIAL_STATE"
	EventUserJoined   EventType = "USER_JOINED"
	EventUserLeft     EventType = "USER_LEFT"
	EventChatMessage  EventType = "CHAT_MESSAGE"
)
