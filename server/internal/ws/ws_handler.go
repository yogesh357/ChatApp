package ws

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Handler struct {
	hub        *Hub
	Repository Repository
}

func NewHandler(h *Hub, repository Repository) *Handler {
	return &Handler{
		hub:        h,
		Repository: repository,
	}
}

type CreateRoomReq struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type CreateRoomRes struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedBy string    `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`
}

func (h *Handler) CreateRoom(c *gin.Context) {
	var req CreateRoomReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// userId MUST come from the validated JWT claims set by middleware.
	// No query param fallback — middleware already ran and rejected unauthenticated requests.
	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return
	}

	room, err := h.Repository.CreateRoom(c.Request.Context(), req.Name, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, CreateRoomRes{
		ID:        room.ID,
		Name:      room.Name,
		CreatedBy: room.CreatedBy,
		CreatedAt: room.CreatedAt,
	})
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// JoinRoom upgrades the HTTP connection to a WebSocket.
//
// Authentication: The middleware (Authenticate) already ran and validated the JWT.
// For browser WebSocket connections, the token must be sent as ?token=<jwt> query param
// because browsers cannot set custom headers on WebSocket handshakes.
//
// Correct connection URL: ws://host/ws/joinRoom/<roomId>?token=<accessToken>
func (h *Handler) JoinRoom(c *gin.Context) {
	roomID := c.Param("roomId")

	// Read identity strictly from the JWT claims injected by the Authenticate middleware.
	// These will only be non-empty if a valid token was presented.
	userID := c.GetString("userId")
	username := c.GetString("username")

	if userID == "" || roomID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "authentication required — send JWT as ?token=<accessToken> query param",
		})
		return
	}

	// Persist user membership in PostgreSQL
	_ = h.Repository.AddRoomMember(c.Request.Context(), roomID, userID, "member")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cl := &Client{
		Conn:     conn,
		Message:  make(chan *Message, 20),
		ID:       userID,
		Username: username,
		RoomID:   roomID,
	}

	m := &Message{
		Content:   "A New user has joined the room",
		RoomID:    roomID,
		Username:  username,
		CreatedAt: time.Now(),
	}

	h.hub.Register <- cl
	h.hub.Broadcast <- m

	go cl.writeMessage()
	cl.readMessage(h.hub)
}

func (h *Handler) GetRooms(c *gin.Context) {
	result, err := h.Repository.GetRooms(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

type ClientRes struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role,omitempty"`
	IsOnline bool   `json:"isOnline"`
}

func (h *Handler) GetClients(c *gin.Context) {
	roomId := c.Param("roomId")

	// 1. Get all members from database
	members, err := h.Repository.GetRoomMembers(c.Request.Context(), roomId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2. Cross-reference with in-memory hub for live online status
	onlineMap := make(map[string]bool)
	if r, ok := h.hub.Rooms[roomId]; ok {
		for id := range r.Clients {
			onlineMap[id] = true
		}
	}

	clients := make([]ClientRes, 0, len(members))
	for _, m := range members {
		clients = append(clients, ClientRes{
			ID:       m.UserID,
			Username: m.Username,
			Role:     m.Role,
			IsOnline: onlineMap[m.UserID],
		})
	}

	c.JSON(http.StatusOK, clients)
}

func (h *Handler) GetMessages(c *gin.Context) {
	roomID := c.Param("roomId")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	messages, err := h.Repository.GetMessages(c.Request.Context(), roomID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}
