FROM nginx:latest

# Certificate root directory
RUN mkdir /etc/nginx/ssl
RUN mkdir -p /opt

ARG COMMIT
ARG APP_VERSION
ARG BUILD_TIME

LABEL \
    soai.app.commit=$COMMIT \
    soai.app.version=$APP_VERSION \
    soai.image.title="SOAI Backend WebServer Service" \
    soai.image.created="$BUILD_TIME"

# nginx configuration
COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf

# Copy default ssl certificate files etc
COPY ./etc/ssl/certs/nginx-selfsigned.crt /etc/nginx/ssl/nginx-selfsigned.crt
COPY ./etc/ssl/certs/nginx-selfsigned.key /etc/nginx/ssl/nginx-selfsigned.key
COPY ./etc/ssl/certs/nginx-dhparam.pem /etc/nginx/ssl/nginx-dhparam.pem

# Copy startup file setting up certificate files on volume shared with host
COPY ./ssl/setup_ssl.sh /docker-entrypoint.d/05-setup_ssl.sh

COPY ./ssl/* /opt

CMD ["nginx", "-g", "daemon off;"]