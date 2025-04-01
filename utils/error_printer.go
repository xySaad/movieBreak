package utils

import (
	"syscall"
)

func Error(err error) {
	syscall.Write(syscall.Stderr, []byte(err.Error()+"\n"))
}

func ErrorS(err string) {
	syscall.Write(syscall.Stderr, []byte(err+"\n"))
}
