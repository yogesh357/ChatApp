package main

import (
	"log"

	"github.com/yogesh/chat/db"
	"github.com/yogesh/chat/internal/user"
	"github.com/yogesh/chat/router"
)

func main() {
	dbConn, err := db.NewDatabase()
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}

	userRep := user.NewRepository(dbConn.GetDB())
	userService := user.NewService(userRep)
	userHandler := user.NewHandler(userService)

	router.InitRouter(userHandler)
	router.Start(":8080")
}
