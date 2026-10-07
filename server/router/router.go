package router

import (
	"github.com/gin-gonic/gin"
	"github.com/yogesh/chat/internal/user"
)

var r *gin.Engine

func InitRouter(userHandler *user.Handler) {
	r = gin.Default()

	r.POST("/signup", userHandler.CreateUser)
	r.POST("/login", userHandler.Login)
	r.POST("/logout", userHandler.Logout)
}

func Start(addr string) error {
	return r.Run(addr)
}
