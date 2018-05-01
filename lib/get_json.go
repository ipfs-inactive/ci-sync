package lib

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

var myClient = &http.Client{Timeout: 10 * time.Second}

func GetJSON(url string, target interface{}) error {
	r, err := myClient.Get(url)
	if r.StatusCode != 200 {
		return errors.New("404")
	}
	if err != nil {
		return err
	}
	defer func() {
		err := r.Body.Close()
		if err != nil {
			panic(err)
		}
	}()

	return json.NewDecoder(r.Body).Decode(target)
}
