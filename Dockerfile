FROM golang:1.9.5-alpine3.7

RUN apk add --update git

WORKDIR /usr/src/app

COPY . .

RUN go get -d -v ./...

RUN go build -o ci-sync main.go

CMD ["./ci-sync"]
