FROM golang:1.27.0-trixie@sha256:6212da3924947f4b6a939df02ea627c13f338f1a41d6c3fcb0dd9d076eef46c4

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
