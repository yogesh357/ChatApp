package router

import (
	"github.com/gin-gonic/gin"
	"github.com/yogesh/chat/internal/user"
)

var r *gin.Engine

func InitRouter(userHandler *user.Handler) {
	r = gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Welcome to the Go Chat API",
		})
	})
	r.POST("/signup", userHandler.CreateUser)
	r.POST("/login", userHandler.Login)
	r.POST("/logout", userHandler.Logout)
}

func Start(addr string) error {
	return r.Run(addr)
}
