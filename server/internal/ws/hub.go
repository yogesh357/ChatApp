package ws

import (
	"context"
	"log"
	"strings"
	"time"
)

type Hub struct {
	Rooms      map[string]*Room
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Message
	repo       Repository
}

func NewHub(repo Repository) *Hub {
	return &Hub{
		Rooms:      make(map[string]*Room),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *Message),
		repo:       repo,
	}
}

func isSystemMessage(content string) bool {
	lower := strings.ToLower(content)
	return strings.Contains(lower, "has joined the room") || strings.Contains(lower, "left the chat")
}

func (h *Hub) Run() {
	for {
		select {
		case cl := <-h.Register:
			r, ok := h.Rooms[cl.RoomID]
			if !ok {
				r = &Room{
					ID:      cl.RoomID,
					Clients: make(map[string]*Client),
				}
				h.Rooms[cl.RoomID] = r
			}

			// If a previous client with same ID was connected (reconnect/refresh), close old one
			if oldCl, exists := r.Clients[cl.ID]; exists && oldCl != cl {
				close(oldCl.Message)
				oldCl.Conn.Close()
			}

			r.Clients[cl.ID] = cl

		case cl := <-h.Unregister:
			if r, ok := h.Rooms[cl.RoomID]; ok {
				if _, exists := r.Clients[cl.ID]; exists {
					delete(r.Clients, cl.ID)
					close(cl.Message)

					if len(r.Clients) > 0 {
						go func(roomID, username string) {
							h.Broadcast <- &Message{
								Content:   "User left the chat",
								RoomID:    roomID,
								Username:  username,
								CreatedAt: time.Now(),
							}
						}(cl.RoomID, cl.Username)
					}
				}
			}

		case m := <-h.Broadcast:
			// If it's a regular user chat message, persist to Postgres
			if h.repo != nil && m.SenderID != "" && !isSystemMessage(m.Content) {
				go func(msg *Message) {
					ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
					defer cancel()

					rec, err := h.repo.SaveMessage(ctx, msg.RoomID, msg.SenderID, msg.Content)
					if err != nil {
						log.Printf("failed to save message to db: %v", err)
					} else if rec != nil {
						msg.ID = rec.ID
						msg.CreatedAt = rec.CreatedAt
					}
				}(m)
			}

			// Broadcast to connected room clients with non-blocking send
			if r, ok := h.Rooms[m.RoomID]; ok {
				for _, cl := range r.Clients {
					select {
					case cl.Message <- m:
					default:
						log.Printf("client %s buffer full, dropping message", cl.ID)
					}
				}
			}
		}
	}
}
