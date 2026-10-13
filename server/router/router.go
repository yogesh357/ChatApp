package router

import (
	"github.com/gin-gonic/gin"
	"github.com/yogesh/chat/internal/user"
	"github.com/yogesh/chat/internal/ws"
	"github.com/yogesh/chat/middleware"
)

var r *gin.Engine

func InitRouter(userHandler *user.Handler, wsHandler *ws.Handler) {
	r = gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Welcome to the Go Chat API",
		})
	})

	// Public Auth endpoints
	r.POST("/signup", userHandler.CreateUser)
	r.POST("/login", userHandler.Login)
	r.POST("/refresh", userHandler.RefreshToken)
	r.POST("/logout", userHandler.Logout)

	// Room and WebSocket endpoints (supports Header, Query token, and Cookie)
	wsGroup := r.Group("/ws")
	// wsGroup.Use(middleware.AuthenticateOptional())
	wsGroup.Use(middleware.Authenticate())
	{
		wsGroup.POST("/createRoom", wsHandler.CreateRoom)
		wsGroup.GET("/rooms", wsHandler.GetRooms)
		wsGroup.GET("/getClients/:roomId", wsHandler.GetClients)
		wsGroup.GET("/messages/:roomId", wsHandler.GetMessages)
		wsGroup.GET("/joinRoom/:roomId", wsHandler.JoinRoom)
	}
}

func Start(addr string) error {
	return r.Run(addr)
}
