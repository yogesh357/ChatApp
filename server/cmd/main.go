package main

import (
	"log"

	"github.com/yogesh/chat/db"
	"github.com/yogesh/chat/internal/user"
	"github.com/yogesh/chat/internal/ws"
	"github.com/yogesh/chat/router"
)

func main() {
	dbConn, err := db.NewDatabase()
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}
	if err := dbConn.GetDB().Ping(); err != nil {
		log.Fatal("Database connection failed:", err)
	}

	log.Println("Connected to PostgreSQL successfully")

	userRep := user.NewRepository(dbConn.GetDB())
	userService := user.NewService(userRep)
	userHandler := user.NewHandler(userService)

	hub := ws.NewHub()
	wsHandler := ws.NewHandler(hub)

	go hub.Run()

	router.InitRouter(userHandler, wsHandler)
	router.Start(":8080")
}
