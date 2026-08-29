FROM public.ecr.aws/amazonlinux/amazonlinux:2023@sha256:5d271dd33b628252c31c15f5449e50d7c4e9f93badf9342f9b1e2a8d326fbe84

RUN dnf install -y google-noto-sans-fonts \
  && dnf clean all \
  && mkdir -p /asset/fonts \
  && cp /usr/share/fonts/google-noto/NotoSans-Regular.ttf /asset/fonts/ \
  && cp /usr/share/fonts/google-noto/NotoSans-Bold.ttf /asset/fonts/

COPY fonts.conf /asset/fonts/
