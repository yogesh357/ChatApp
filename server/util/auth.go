package utils

import (
	"encoding/json"
	"net/http"

	"github.com/yogesh/chat/helpers"
)

func ParseJSON(r *http.Request, dst interface{}) error {
	return json.NewDecoder(r.Body).Decode(dst)
}

func ValidateToken(signedToken string) (*helpers.SignedDetails, error) {
	return helpers.ValidateToken(signedToken)
}
