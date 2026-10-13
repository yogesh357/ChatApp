package user

import (
	"context"
	"database/sql"
	"fmt"
)

type DBTX interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	PrepareContext(context.Context, string) (*sql.Stmt, error)
	QueryContext(context.Context, string, ...interface{}) (*sql.Rows, error)
	QueryRowContext(context.Context, string, ...interface{}) *sql.Row
}

type repository struct {
	db DBTX
}

func NewRepository(db DBTX) Repository {
	return &repository{
		db: db,
	}
}

func (r *repository) CreateUser(ctx context.Context, user *User) (*User, error) {
	query := `
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, created_at
	`
	err := r.db.QueryRowContext(ctx, query, user.Username, user.Email, user.Password).
		Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return user, nil
}

func (r *repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, username, email, password_hash, created_at
		FROM users
		WHERE email = $1
	`
	var u User
	err := r.db.QueryRowContext(ctx, query, email).
		Scan(&u.ID, &u.Username, &u.Email, &u.Password, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}

	return &u, nil
}

func (r *repository) GetUserByID(ctx context.Context, id string) (*User, error) {
	query := `
		SELECT id, username, email, password_hash, created_at
		FROM users
		WHERE id = $1
	`
	var u User
	err := r.db.QueryRowContext(ctx, query, id).
		Scan(&u.ID, &u.Username, &u.Email, &u.Password, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}

	return &u, nil
}

func (r *repository) SaveRefreshToken(ctx context.Context, token *RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (user_id, token, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	err := r.db.QueryRowContext(ctx, query, token.UserID, token.Token, token.ExpiresAt).
		Scan(&token.ID, &token.CreatedAt)
	if err != nil {
		return fmt.Errorf("save refresh token: %w", err)
	}

	return nil
}

func (r *repository) GetRefreshToken(ctx context.Context, token string) (*RefreshToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, created_at, revoked
		FROM refresh_tokens
		WHERE token = $1
	`
	var rt RefreshToken
	err := r.db.QueryRowContext(ctx, query, token).
		Scan(&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiresAt, &rt.CreatedAt, &rt.Revoked)
	if err != nil {
		return nil, fmt.Errorf("get refresh token: %w", err)
	}

	return &rt, nil
}

func (r *repository) RevokeRefreshToken(ctx context.Context, token string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked = true
		WHERE token = $1
	`
	_, err := r.db.ExecContext(ctx, query, token)
	if err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}

	return nil
}

func (r *repository) RevokeAllUserRefreshTokens(ctx context.Context, userID string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked = true
		WHERE user_id = $1
	`
	_, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("revoke all refresh tokens: %w", err)
	}

	return nil
}
