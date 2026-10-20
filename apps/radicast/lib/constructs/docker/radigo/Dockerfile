FROM mwader/static-ffmpeg:9.0.2-1@sha256:f5d100184884eb3e82b0eb14bb5ebf98da99826ac824989720297fb9ef21c822 AS ffmpeg

FROM golang:1.27.2-trixie@sha256:47667934874913a449b96faa7ef4777fa285d9ec29126ee80ed61c45b7cccf0e

COPY --from=ffmpeg /ffmpeg /asset/bin/ffmpeg

ADD https://github.com/yfujikaw/radigo.git#bb1a26850bbf4d4a7809d35b2f4a97cf77611d08 /tmp/radigo

RUN cd /tmp/radigo \
  && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o /asset/bin/radigo ./cmd/radigo
