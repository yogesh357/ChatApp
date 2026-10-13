package ws_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/yogesh/chat/internal/user"
	"github.com/yogesh/chat/internal/ws"
)

func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("postgres", "postgresql://root:password@localhost:5431/go-chat?sslmode=disable")
	if err != nil {
		t.Skip("Postgres not available, skipping db test")
	}
	if err := db.Ping(); err != nil {
		t.Skip("Postgres not responding, skipping db test")
	}
	return db
}

func TestWsRepositoryAndDBFlow(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// 1. Create a test user for foreign key
	userRepo := user.NewRepository(db)
	userService := user.NewService(userRepo)
	uniqueEmail := "ws_user_" + time.Now().Format("20060102150405.000") + "@example.com"
	u, err := userService.CreateUser(ctx, &user.CreateUserReq{
		Username: "ws_user_" + time.Now().Format("150405"),
		Email:    uniqueEmail,
		Password: "password123",
	})
	if err != nil {
		t.Fatalf("failed to create user for ws test: %v", err)
	}

	wsRepo := ws.NewRepository(db)

	// 2. Create Room
	room, err := wsRepo.CreateRoom(ctx, "Test General Room", u.ID)
	if err != nil {
		t.Fatalf("failed to create room in db: %v", err)
	}
	if room.ID == "" {
		t.Fatal("expected room UUID")
	}

	// 3. Verify creator is in room_members
	members, err := wsRepo.GetRoomMembers(ctx, room.ID)
	if err != nil {
		t.Fatalf("failed to get room members: %v", err)
	}
	if len(members) == 0 || members[0].UserID != u.ID {
		t.Fatalf("expected creator %s to be room member, got %+v", u.ID, members)
	}

	// 4. Get Rooms
	rooms, err := wsRepo.GetRooms(ctx)
	if err != nil {
		t.Fatalf("failed to get rooms: %v", err)
	}
	if len(rooms) == 0 {
		t.Fatal("expected at least 1 room")
	}

	// 5. Save Message
	msg, err := wsRepo.SaveMessage(ctx, room.ID, u.ID, "Hello PostgreSQL chat!")
	if err != nil {
		t.Fatalf("failed to save message to db: %v", err)
	}
	if msg.ID == "" {
		t.Fatal("expected message UUID")
	}

	// 6. Get Messages
	messages, err := wsRepo.GetMessages(ctx, room.ID, 10)
	if err != nil {
		t.Fatalf("failed to get messages: %v", err)
	}
	if len(messages) == 0 {
		t.Fatal("expected at least 1 message")
	}
	if messages[0].Content != "Hello PostgreSQL chat!" {
		t.Fatalf("unexpected message content: %s", messages[0].Content)
	}
}
