package ws

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type Room struct {
	ID        string             `json:"id"`
	Name      string             `json:"name"`
	CreatedBy string             `json:"createdBy,omitempty"`
	CreatedAt time.Time          `json:"createdAt,omitempty"`
	Clients   map[string]*Client `json:"-"`
}

type RoomMember struct {
	UserID   string    `json:"userId"`
	Username string    `json:"username"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joinedAt"`
}

type MessageRecord struct {
	ID        string    `json:"id"`
	RoomID    string    `json:"roomId"`
	SenderID  string    `json:"senderId"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

type Repository interface {
	CreateRoom(ctx context.Context, name, createdBy string) (*Room, error)
	GetRooms(ctx context.Context) ([]Room, error)
	GetRoomByID(ctx context.Context, id string) (*Room, error)
	AddRoomMember(ctx context.Context, roomID, userID, role string) error
	GetRoomMembers(ctx context.Context, roomID string) ([]RoomMember, error)
	SaveMessage(ctx context.Context, roomID, senderID, content string) (*MessageRecord, error)
	GetMessages(ctx context.Context, roomID string, limit int) ([]MessageRecord, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{
		db: db,
	}
}

func (r *repository) CreateRoom(ctx context.Context, name, createdBy string) (*Room, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	// 1. Insert room
	var room Room
	queryRoom := `
		INSERT INTO rooms (name, created_by)
		VALUES ($1, $2)
		RETURNING id, name, created_by, created_at
	`
	err = tx.QueryRowContext(ctx, queryRoom, name, createdBy).
		Scan(&room.ID, &room.Name, &room.CreatedBy, &room.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert room: %w", err)
	}

	// 2. Add creator as owner in room_members
	queryMember := `
		INSERT INTO room_members (room_id, user_id, role)
		VALUES ($1, $2, 'owner')
		ON CONFLICT (room_id, user_id) DO NOTHING
	`
	_, err = tx.ExecContext(ctx, queryMember, room.ID, createdBy)
	if err != nil {
		return nil, fmt.Errorf("insert room owner: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	room.Clients = make(map[string]*Client)
	return &room, nil
}

func (r *repository) GetRooms(ctx context.Context) ([]Room, error) {
	query := `
		SELECT id, name, created_by, created_at
		FROM rooms
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get rooms: %w", err)
	}
	defer rows.Close()

	rooms := make([]Room, 0)
	for rows.Next() {
		var room Room
		if err := rows.Scan(&room.ID, &room.Name, &room.CreatedBy, &room.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan room: %w", err)
		}
		room.Clients = make(map[string]*Client)
		rooms = append(rooms, room)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return rooms, nil
}

func (r *repository) GetRoomByID(ctx context.Context, id string) (*Room, error) {
	query := `
		SELECT id, name, created_by, created_at
		FROM rooms
		WHERE id = $1
	`
	var room Room
	err := r.db.QueryRowContext(ctx, query, id).
		Scan(&room.ID, &room.Name, &room.CreatedBy, &room.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get room by id: %w", err)
	}
	room.Clients = make(map[string]*Client)
	return &room, nil
}

func (r *repository) AddRoomMember(ctx context.Context, roomID, userID, role string) error {
	query := `
		INSERT INTO room_members (room_id, user_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (room_id, user_id) DO NOTHING
	`
	_, err := r.db.ExecContext(ctx, query, roomID, userID, role)
	if err != nil {
		return fmt.Errorf("add room member: %w", err)
	}
	return nil
}

func (r *repository) GetRoomMembers(ctx context.Context, roomID string) ([]RoomMember, error) {
	query := `
		SELECT u.id, u.username, rm.role, rm.joined_at
		FROM room_members rm
		JOIN users u ON rm.user_id = u.id
		WHERE rm.room_id = $1
		ORDER BY rm.joined_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, roomID)
	if err != nil {
		return nil, fmt.Errorf("get room members: %w", err)
	}
	defer rows.Close()

	members := make([]RoomMember, 0)
	for rows.Next() {
		var m RoomMember
		if err := rows.Scan(&m.UserID, &m.Username, &m.Role, &m.JoinedAt); err != nil {
			return nil, fmt.Errorf("scan room member: %w", err)
		}
		members = append(members, m)
	}
	return members, nil
}

func (r *repository) SaveMessage(ctx context.Context, roomID, senderID, content string) (*MessageRecord, error) {
	query := `
		INSERT INTO messages (room_id, sender_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	var msg MessageRecord
	msg.RoomID = roomID
	msg.SenderID = senderID
	msg.Content = content

	err := r.db.QueryRowContext(ctx, query, roomID, senderID, content).
		Scan(&msg.ID, &msg.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("save message: %w", err)
	}

	return &msg, nil
}

func (r *repository) GetMessages(ctx context.Context, roomID string, limit int) ([]MessageRecord, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := `
		SELECT m.id, m.room_id, m.sender_id, u.username, m.content, m.created_at
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.room_id = $1
		ORDER BY m.created_at ASC
		LIMIT $2
	`
	rows, err := r.db.QueryContext(ctx, query, roomID, limit)
	if err != nil {
		return nil, fmt.Errorf("get messages: %w", err)
	}
	defer rows.Close()

	messages := make([]MessageRecord, 0)
	for rows.Next() {
		var msg MessageRecord
		if err := rows.Scan(&msg.ID, &msg.RoomID, &msg.SenderID, &msg.Username, &msg.Content, &msg.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		messages = append(messages, msg)
	}
	return messages, nil
}
