package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yogesh/chat/helpers"
)

// Authenticate strictly validates that a valid JWT is provided.
func Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractToken(c)
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			return
		}

		claims, err := helpers.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			return
		}

		c.Set("userId", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Next()
	}
}

// AuthenticateOptional extracts claims if a token is present, but doesn't block if absent.
func AuthenticateOptional() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractToken(c)
		if tokenString != "" {
			if claims, err := helpers.ValidateToken(tokenString); err == nil {
				c.Set("userId", claims.UserID)
				c.Set("username", claims.Username)
				c.Set("email", claims.Email)
			}
		}
		c.Next()
	}
}

func extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	// Query parameter (useful for browser WebSocket connections)
	if tokenQuery := c.Query("token"); tokenQuery != "" {
		return tokenQuery
	}

	// Cookie fallback
	if cookie, err := c.Cookie("jwt"); err == nil && cookie != "" {
		return cookie
	}

	return ""
}
