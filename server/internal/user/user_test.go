package user_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/yogesh/chat/helpers"
	"github.com/yogesh/chat/internal/user"
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

func TestUserAndTokenFlow(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := user.NewRepository(db)
	service := user.NewService(repo)
	ctx := context.Background()

	// 1. Create User
	uniqueEmail := "test_" + time.Now().Format("20060102150405.000") + "@example.com"
	createReq := &user.CreateUserReq{
		Username: "user_" + time.Now().Format("150405"),
		Email:    uniqueEmail,
		Password: "password123",
	}

	created, err := service.CreateUser(ctx, createReq)
	if err != nil {
		t.Fatalf("failed to create user: %v", err)
	}
	if created.ID == "" {
		t.Fatal("expected non-empty UUID for user ID")
	}

	// 2. Login User
	loginReq := &user.LoginUserReq{
		Email:    uniqueEmail,
		Password: "password123",
	}
	loginRes, err := service.Login(ctx, loginReq)
	if err != nil {
		t.Fatalf("failed to login user: %v", err)
	}
	if loginRes.AccessToken == "" || loginRes.RefreshToken == "" {
		t.Fatal("expected access and refresh tokens")
	}

	// Validate Access Token Claims
	claims, err := helpers.ValidateToken(loginRes.AccessToken)
	if err != nil {
		t.Fatalf("access token validation failed: %v", err)
	}
	if claims.UserID != created.ID {
		t.Fatalf("expected claim user ID %s, got %s", created.ID, claims.UserID)
	}

	// 3. Refresh Token
	refreshReq := &user.RefreshTokenReq{
		RefreshToken: loginRes.RefreshToken,
	}
	refreshRes, err := service.RefreshToken(ctx, refreshReq)
	if err != nil {
		t.Fatalf("failed to refresh token: %v", err)
	}
	if refreshRes.AccessToken == "" || refreshRes.RefreshToken == "" {
		t.Fatal("expected new access and refresh tokens")
	}

	// 4. Old Refresh Token should now be revoked (Rotation)
	_, err = service.RefreshToken(ctx, refreshReq)
	if err == nil {
		t.Fatal("expected rotated refresh token to be rejected")
	}

	// 5. Logout
	err = service.Logout(ctx, refreshRes.RefreshToken, created.ID)
	if err != nil {
		t.Fatalf("logout failed: %v", err)
	}
}
