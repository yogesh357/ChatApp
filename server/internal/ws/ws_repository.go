package ws

import (
	"context"
	"database/sql"
	"fmt"
)

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{
		db: db,
	}
}
func (r *repository) CreateRoom(
	ctx context.Context,
	req *CreateRoomReq,
) (*CreateRoomRes, error) {
	query := `
        INSERT INTO rooms (name)
        VALUES ($1)
        RETURNING id, name
    `

	var res CreateRoomRes

	err := r.db.QueryRowContext(ctx, query, req.Name).
		Scan(&res.ID, &res.Name)
	if err != nil {
		return nil, fmt.Errorf("create room: %w", err)
	}

	return &res, nil
}

func (r *repository) GetRooms(ctx context.Context) {

}

func (r *repository) GetClients(ctx context.Context) {

}
