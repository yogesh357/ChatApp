package user

import (
	"context"
	"time"
)

type User struct {
	ID        string    `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"password,omitempty" db:"password_hash"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type RefreshToken struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	Revoked   bool      `json:"revoked" db:"revoked"`
}

type CreateUserReq struct {
	Username string `json:"username" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type CreateUserRes struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

type LoginUserReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginUserRes struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ID           string `json:"id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
}

type RefreshTokenReq struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type RefreshTokenRes struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type Repository interface {
	CreateUser(ctx context.Context, user *User) (*User, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id string) (*User, error)
	SaveRefreshToken(ctx context.Context, token *RefreshToken) error
	GetRefreshToken(ctx context.Context, token string) (*RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, token string) error
	RevokeAllUserRefreshTokens(ctx context.Context, userID string) error
}

type Service interface {
	CreateUser(ctx context.Context, req *CreateUserReq) (*CreateUserRes, error)
	Login(ctx context.Context, req *LoginUserReq) (*LoginUserRes, error)
	RefreshToken(ctx context.Context, req *RefreshTokenReq) (*RefreshTokenRes, error)
	Logout(ctx context.Context, refreshToken string, userID string) error
}
