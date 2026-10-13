package ws

import (
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn     *websocket.Conn
	Message  chan *Message
	ID       string `json:"id"`
	RoomID   string `json:"roomId"`
	Username string `json:"username"`
}

type Message struct {
	ID        string    `json:"id,omitempty"`
	Content   string    `json:"content"`
	RoomID    string    `json:"roomId"`
	SenderID  string    `json:"senderId,omitempty"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
}

func (c *Client) writeMessage() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		message, ok := <-c.Message
		if !ok {
			return
		}

		if err := c.Conn.WriteJSON(message); err != nil {
			return
		}
	}
}

func (c *Client) readMessage(hub *Hub) {
	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, m, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket read error: %v", err)
			}
			break
		}

		trimmed := strings.TrimSpace(string(m))
		if trimmed == "" {
			continue
		}

		msg := &Message{
			Content:   trimmed,
			RoomID:    c.RoomID,
			SenderID:  c.ID,
			Username:  c.Username,
			CreatedAt: time.Now(),
		}

		hub.Broadcast <- msg
	}
}
