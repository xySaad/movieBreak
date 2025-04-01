package proxy

import (
	"encoding/json"
	"io"
	"moviebreak/utils"
	"net/http"
)

type payload struct {
	Destination string `json:"destination"`
	Referrer    string `json:"referrer"`
}

func Post(resp http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(resp, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	resp.Header().Set("Access-Control-Allow-Origin", "*")

	bodyB, err := io.ReadAll(req.Body)
	if err != nil {
		http.Error(resp, "error reading the body", 500)
		return
	}
	body := payload{}

	err = json.Unmarshal(bodyB, &body)
	if err != nil {
		utils.Error(err)
		http.Error(resp, "error decoding json payload", 500)
		return
	}

	// Create a new request using http.NewRequest
	destinationReq, err := http.NewRequest("GET", body.Destination, nil)
	if err != nil {
		http.Error(resp, "cannot create NewRequest", 500)
		return
	}

	// Create a new HTTP client
	client := &http.Client{}

	destinationResp, err := client.Do(destinationReq)
	if err != nil {
		utils.Error(err)
		http.Error(resp, "cannot send request to destination", http.StatusInternalServerError)
		return
	}
	defer destinationResp.Body.Close()

	resp.WriteHeader(destinationResp.StatusCode)

	// Copy the headers from the destination response to the original response
	for key, value := range destinationResp.Header {
		resp.Header()[key] = value
	}

	defaultHeaders(destinationReq)

	desttinationBody, err := io.ReadAll(destinationResp.Body)
	if err != nil {
		http.Error(resp, "cannot read destination response body", http.StatusInternalServerError)
		return
	}

	resp.Write(desttinationBody)
}
