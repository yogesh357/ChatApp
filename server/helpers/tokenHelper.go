package helpers

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type SignedDetails struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func getSecretKey() []byte {
	key := os.Getenv("SECRET_KEY")
	if key == "" {
		key = "super-secret-chat-app-key-change-in-prod"
	}
	return []byte(key)
}

// GenerateTokens generates an access token (24h) and a refresh token (7 days).
func GenerateTokens(userID, username, email string) (string, string, error) {
	secret := getSecretKey()

	nonce := fmt.Sprintf("%d_%d", time.Now().UnixNano(), time.Now().Unix())

	// Access Token (24 Hours)
	accessClaims := &SignedDetails{
		UserID:   userID,
		Username: username,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        "acc_" + nonce,
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(secret)
	if err != nil {
		return "", "", fmt.Errorf("sign access token: %w", err)
	}

	// Refresh Token (7 Days)
	refreshClaims := &SignedDetails{
		UserID:   userID,
		Username: username,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        "ref_" + nonce,
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(secret)
	if err != nil {
		return "", "", fmt.Errorf("sign refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// ValidateToken validates a JWT token and returns the claims.
func ValidateToken(signedToken string) (*SignedDetails, error) {
	token, err := jwt.ParseWithClaims(
		signedToken,
		&SignedDetails{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return getSecretKey(), nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*SignedDetails)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
