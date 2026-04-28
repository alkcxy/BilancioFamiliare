# Stage 1: Ottieni Node.js e Yarn
FROM node:20-bullseye-slim AS node

# Stage 2: Immagine finale Ruby
FROM ruby:3.2-bullseye

COPY --from=node /usr/local/bin /usr/local/bin
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node /opt /opt

# APT: Ignora SSL per Zscaler
RUN echo 'Acquire::https::Verify-Peer "false";' > /etc/apt/apt.conf.d/99ignore-ssl && \
    echo 'Acquire::https::Verify-Host "false";' >> /etc/apt/apt.conf.d/99ignore-ssl

RUN apt-get update && apt-get install -y -qq \
    build-essential \
    default-libmysqlclient-dev \
    default-mysql-client \
    git \
    python3 \
    ca-certificates \
    --no-install-recommends && \
    ln -s /usr/bin/python3 /usr/bin/python

# Installa Bundler 2.x tramite HTTP (necessario per Rails 7+)
RUN gem install bundler:2.4.22 --no-document --source http://rubygems.org

WORKDIR /bilancio

# Copiamo tutto subito. L'installazione avverrà all'avvio del container (entrypoint)
# per evitare i timeout del Docker Build causati da Zscaler.
COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 3000
CMD ["./entrypoint.sh"]
