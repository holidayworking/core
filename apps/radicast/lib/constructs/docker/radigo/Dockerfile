FROM golang:1.27.2-trixie@sha256:e58d6f83b3416618d8bcac2b3dde1b7f7e3c4a77d25e88637f8bbae81536c48d

ADD --checksum=sha256:f4149bb2b0784e30e99bdda85471c9b5930d3402014e934a5098b41d0f7201b1 "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz" /tmp

RUN apt-get update && apt-get install --no-install-recommends -y xz-utils \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /asset/bin \
  && tar -xJf /tmp/ffmpeg-release-arm64-static.tar.xz -C /tmp \
  && mv /tmp/ffmpeg-*-arm64-static/ffmpeg /asset/bin/ffmpeg

ADD https://github.com/yfujikaw/radigo.git#bb1a26850bbf4d4a7809d35b2f4a97cf77611d08 /tmp/radigo

RUN cd /tmp/radigo \
  && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o /asset/bin/radigo ./cmd/radigo
