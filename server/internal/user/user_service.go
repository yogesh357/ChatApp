package user

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/yogesh/chat/helpers"
	utils "github.com/yogesh/chat/util"
)

type service struct {
	repo    Repository
	timeout time.Duration
}

func NewService(repo Repository) Service {
	return &service{
		repo:    repo,
		timeout: 5 * time.Second,
	}
}

func (s *service) CreateUser(c context.Context, req *CreateUserReq) (*CreateUserRes, error) {
	ctx, cancel := context.WithTimeout(c, s.timeout)
	defer cancel()

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	u := &User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
	}

	created, err := s.repo.CreateUser(ctx, u)
	if err != nil {
		return nil, err
	}

	return &CreateUserRes{
		ID:       created.ID,
		Username: created.Username,
		Email:    created.Email,
	}, nil
}

func (s *service) Login(c context.Context, req *LoginUserReq) (*LoginUserRes, error) {
	ctx, cancel := context.WithTimeout(c, s.timeout)
	defer cancel()

	u, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	err = utils.ComparePassword(u.Password, req.Password)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	accessToken, refreshToken, err := helpers.GenerateTokens(u.ID, u.Username, u.Email)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	// Persist refresh token in database
	rt := &RefreshToken{
		UserID:    u.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	if err := s.repo.SaveRefreshToken(ctx, rt); err != nil {
		return nil, fmt.Errorf("save refresh token: %w", err)
	}

	return &LoginUserRes{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ID:           u.ID,
		Username:     u.Username,
		Email:        u.Email,
	}, nil
}

func (s *service) RefreshToken(c context.Context, req *RefreshTokenReq) (*RefreshTokenRes, error) {
	ctx, cancel := context.WithTimeout(c, s.timeout)
	defer cancel()

	// 1. Validate JWT structure and signature
	claims, err := helpers.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	// 2. Look up token in database
	storedToken, err := s.repo.GetRefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, errors.New("refresh token not found")
	}

	if storedToken.Revoked {
		return nil, errors.New("refresh token has been revoked")
	}

	if time.Now().After(storedToken.ExpiresAt) {
		return nil, errors.New("refresh token has expired")
	}

	// 3. Revoke the used refresh token (Token Rotation for security)
	_ = s.repo.RevokeRefreshToken(ctx, req.RefreshToken)

	// 4. Generate new tokens
	newAccessToken, newRefreshToken, err := helpers.GenerateTokens(claims.UserID, claims.Username, claims.Email)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	// 5. Store new refresh token
	newRT := &RefreshToken{
		UserID:    claims.UserID,
		Token:     newRefreshToken,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	if err := s.repo.SaveRefreshToken(ctx, newRT); err != nil {
		return nil, fmt.Errorf("save new refresh token: %w", err)
	}

	return &RefreshTokenRes{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *service) Logout(c context.Context, refreshToken string, userID string) error {
	ctx, cancel := context.WithTimeout(c, s.timeout)
	defer cancel()

	if refreshToken != "" {
		return s.repo.RevokeRefreshToken(ctx, refreshToken)
	}

	if userID != "" {
		return s.repo.RevokeAllUserRefreshTokens(ctx, userID)
	}

	return nil
}
