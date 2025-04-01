package main

import (
	"moviebreak/handlers"
	"moviebreak/proxy"
	"moviebreak/utils"
	"net/http"
)

func main() {
	http.HandleFunc("/", handlers.Static)
	http.HandleFunc("/proxy/", proxy.Post)
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		utils.Error(err)
	}
}
