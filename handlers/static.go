package handlers

import (
	"net/http"
)

func Static(resp http.ResponseWriter, req *http.Request) {
	path := req.URL.Path
	http.ServeFile(resp, req, "./frontend/build"+path)
}
