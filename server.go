package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func imageHandler(w http.ResponseWriter, r *http.Request) {
	imagePath := r.RequestURI[1:]
	if _, err := os.Open(imagePath); err != nil {
		http.ServeFile(w, r, "images/error.jpg")
	} else {
		http.ServeFile(w, r, imagePath)
	}
}

func deleteEventHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	eventElements := strings.Split(string(body), ";")
	if len(eventElements) != 2 {
		http.Error(w, "Wrong format in request body", http.StatusBadRequest)
		return
	}
	eventName := eventElements[0]
	className := eventElements[1]

	eventsFile, err := os.Open("events.csv")
	defer eventsFile.Close()
	if err != nil {
		http.Error(w, "Error deleting the event", http.StatusInternalServerError)
		return
	}
	eventsFileContent, err := io.ReadAll(eventsFile)
	if err != nil {
		http.Error(w, "Error deleting the event", http.StatusInternalServerError)
		return
	}
	eventLines := strings.Split(string(eventsFileContent), "\n")

	tempFile, err := os.Create("events-temp.csv")
	if err != nil {
		http.Error(w, "Error deleting the event", http.StatusInternalServerError)
		return
	}

	for _, currLine := range eventLines {
		lineElements := strings.Split(currLine, ",")
		if len(lineElements) != 5 {
			continue
		}
		currEventName := lineElements[0]
		currClassName := lineElements[1]
		if currEventName != eventName || currClassName != className {
			tempFile.WriteString(currLine + "\n")
		}
	}

	os.Remove("events.csv")
	os.Rename("events-temp.csv", "events.csv")
}

func isNumeric(s string) bool {
	_, err := strconv.ParseInt(s, 10, 64)
	return err == nil
}

func createEventHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	eventElements := strings.Split(string(body), ",")
	if len(eventElements) != 5 {
		http.Error(w, "Error in event formatting", http.StatusBadRequest)
		return
	} else if !isNumeric(eventElements[2]) || !isNumeric(eventElements[3]) {
		http.Error(w, "Error in event formatting", http.StatusBadRequest)
		return
	}
	eventName := eventElements[0]
	eventClass := eventElements[1]

	eventsFile, err := os.Open("events.csv")
	defer eventsFile.Close()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	eventsFileContent, err := io.ReadAll(eventsFile)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	eventsFileLines := strings.Split(string(eventsFileContent), "\n")

	for _, currLine := range eventsFileLines {
		lineElements := strings.Split(currLine, ",")
		if len(lineElements) != 5 {
			continue
		}
		currEventName := lineElements[0]
		currEventClass := lineElements[1]

		if currEventName == eventName && currEventClass == eventClass {
			w.Write([]byte("Event already exists"))
			return
		}
	}
	eventsFile.Close()

	eventsFile, err = os.OpenFile("events.csv", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	eventsFile.WriteString(string(body) + "\n")
}

func main() {
	http.HandleFunc("/{$}", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "main.html")
	})
	http.HandleFunc("/style.css", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "style.css")
	})
	http.HandleFunc("/index.js", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.js")
	})
	http.HandleFunc("/events.csv", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "events.csv")
	})
	http.HandleFunc("/images/", imageHandler)
	http.HandleFunc("/delete-event", deleteEventHandler)
	http.HandleFunc("/create-event", createEventHandler)

	log.Fatal(http.ListenAndServe(":8080", nil))
}
