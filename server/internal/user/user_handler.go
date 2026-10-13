package user

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{
		Service: service,
	}
}

func (h *Handler) CreateUser(c *gin.Context) {
	var req CreateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.Service.CreateUser(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.Service.Login(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Set HTTP-only cookie for web browsers
	c.SetCookie("jwt", res.AccessToken, 3600*24, "/", "", false, true)
	c.SetCookie("refresh_token", res.RefreshToken, 3600*24*7, "/", "", false, true)

	c.JSON(http.StatusOK, res)
}

func (h *Handler) RefreshToken(c *gin.Context) {
	var req RefreshTokenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		// Fallback to cookie if not in JSON body
		if cookie, err := c.Cookie("refresh_token"); err == nil && cookie != "" {
			req.RefreshToken = cookie
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token is required"})
			return
		}
	}

	res, err := h.Service.RefreshToken(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.SetCookie("jwt", res.AccessToken, 3600*24, "/", "", false, true)
	c.SetCookie("refresh_token", res.RefreshToken, 3600*24*7, "/", "", false, true)

	c.JSON(http.StatusOK, res)
}

func (h *Handler) Logout(c *gin.Context) {
	var req RefreshTokenReq
	_ = c.ShouldBindJSON(&req)

	if req.RefreshToken == "" {
		if cookie, err := c.Cookie("refresh_token"); err == nil {
			req.RefreshToken = cookie
		}
	}

	userID := c.GetString("userId")

	_ = h.Service.Logout(c.Request.Context(), req.RefreshToken, userID)

	c.SetCookie("jwt", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "successfully logged out"})
}
